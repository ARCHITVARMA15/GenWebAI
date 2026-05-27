const extractJson = async (text) => {
    if (!text) return null

    const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()

    const firstBrace = cleaned.indexOf('{')
    const closeBrace = cleaned.lastIndexOf('}')

    if (firstBrace === -1 || closeBrace === -1 || closeBrace < firstBrace) {
        return null
    }

    const jsonString = cleaned.slice(firstBrace, closeBrace + 1)

    // Attempt 1: direct parse
    try {
        return JSON.parse(jsonString)
    } catch (_) {}

    // Attempt 2: fix backslashes not part of valid JSON escape sequences
    try {
        const fixed = jsonString.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        return JSON.parse(fixed)
    } catch (_) {}

    // Attempt 3: strip all lone backslashes
    try {
        const stripped = jsonString.replace(/\\(?!["\\/bfnrtu])/g, '')
        return JSON.parse(stripped)
    } catch (_) {}

    return null
}

export default extractJson