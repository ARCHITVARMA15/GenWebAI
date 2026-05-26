const aiModels = {
    gemini: {
        label: "Gemini Flash 1.5",
        modelId: "google/gemini-flash-1.5",
        description: "Fast and free tier compatible",
        badge: "Fastest",
        creditsPerGeneration: 50,
        available: ["free", "pro", "enterprise"]
    },
    claude: {
        label: "Claude 3.5 Sonnet",
        modelId: "anthropic/claude-3.5-sonnet",
        description: "Best for clean, modern designs",
        badge: "Best Design",
        creditsPerGeneration: 75,
        available: ["pro", "enterprise"]
    },
    gpt4o: {
        label: "GPT-4o",
        modelId: "openai/gpt-4o",
        description: "Best overall quality",
        badge: "Best Quality",
        creditsPerGeneration: 100,
        available: ["pro", "enterprise"]
    }
}

export default aiModels
