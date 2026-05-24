const extractJson = async (text) => {
    if (!text) {
        return null
    }

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
    return JSON.parse(jsonString)


}

export default extractJson 