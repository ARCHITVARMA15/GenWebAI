const aiModels = {
    gemini: {
        label: "Gemini 2.5 Flash",
        modelId: "openrouter/auto",
        description: "Fast and free tier compatible",
        badge: "Fastest",
        creditsPerGeneration: 30,
        available: ["free", "pro", "enterprise"]
    },
    claude: {
        label: "Claude 3.5 Sonnet",
        modelId: "anthropic/claude-3.5-sonnet",
        description: "Best for clean, modern designs",
        badge: "Best Design",
        creditsPerGeneration: 45,
        available: ["pro", "enterprise"],
        comingSoon: true
    },
    gpt4o: {
        label: "GPT-4o",
        modelId: "openai/gpt-4o",
        description: "Best overall quality",
        badge: "Best Quality",
        creditsPerGeneration: 60,
        available: ["pro", "enterprise"],
        comingSoon: true
    }
}

export default aiModels
