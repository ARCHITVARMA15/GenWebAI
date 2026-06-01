import * as cheerio from 'cheerio'

export async function fetchGitHubData(githubUrl) {
    const match = githubUrl.match(/github\.com\/([^/?#\s]+)/)
    if (!match) throw new Error('Invalid GitHub URL — must be https://github.com/username')
    const username = match[1]

    const headers = {
        'User-Agent': 'AIWebsiteBuilder/1.0 (portfolio-generator)',
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    try {
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`, { headers, signal: controller.signal }),
            fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=30&type=owner`, { headers, signal: controller.signal })
        ])

        if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found`)
        if (!userRes.ok) throw new Error(`GitHub API error: ${userRes.status}`)

        const [user, allRepos] = await Promise.all([
            userRes.json(),
            reposRes.ok ? reposRes.json() : Promise.resolve([])
        ])

        const repos = Array.isArray(allRepos)
            ? allRepos
                .filter(r => !r.fork && r.name !== username)
                .sort((a, b) => {
                    if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count
                    return new Date(b.pushed_at) - new Date(a.pushed_at)
                })
                .slice(0, 6)
                .map(r => ({
                    name: r.name,
                    description: r.description || '',
                    language: r.language || '',
                    stars: r.stargazers_count,
                    forks: r.forks_count,
                    lastUpdated: r.pushed_at ? new Date(r.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
                    url: r.html_url,
                    topics: r.topics || []
                }))
            : []

        const langMap = {}
        if (Array.isArray(allRepos)) {
            allRepos.filter(r => !r.fork && r.language).forEach(r => {
                langMap[r.language] = (langMap[r.language] || 0) + 1
            })
        }
        const skills = Object.entries(langMap)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang)

        return {
            username,
            name: user.name || username,
            bio: user.bio || '',
            location: user.location || '',
            avatarUrl: user.avatar_url || '',
            githubUrl: user.html_url,
            blog: user.blog || '',
            company: user.company || '',
            publicRepos: user.public_repos || 0,
            followers: user.followers || 0,
            repos,
            skills
        }
    } finally {
        clearTimeout(timeout)
    }
}

export async function scrapeCertUrl(url) {
    if (!url?.startsWith('http')) return null
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AIWebsiteBuilder/1.0)',
                'Accept': 'text/html,application/xhtml+xml'
            }
        }).finally(() => clearTimeout(timeout))

        if (!res.ok) return null

        const html = await res.text()
        const $ = cheerio.load(html)

        const ogTitle = $('meta[property="og:title"]').attr('content')
        const metaTitle = $('meta[name="title"]').attr('content')
        const pageTitle = $('title').text()

        const ogDesc = $('meta[property="og:description"]').attr('content')
        const metaDesc = $('meta[name="description"]').attr('content')

        const ogSite = $('meta[property="og:site_name"]').attr('content')

        let issuer = ogSite || ''
        if (!issuer) {
            try {
                const hostname = new URL(url).hostname.replace('www.', '')
                issuer = hostname.split('.')[0]
            } catch { issuer = '' }
        }

        const name = (ogTitle || metaTitle || pageTitle || '').trim().slice(0, 150)
        const description = (ogDesc || metaDesc || '').trim().slice(0, 250)

        if (!name) return null

        return { name, issuer: issuer.trim().slice(0, 80), description, url }
    } catch {
        return null
    }
}
