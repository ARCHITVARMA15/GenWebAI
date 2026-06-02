import React, { useState } from 'react';
import { MapPin, Link2, X, Send, Sparkles } from 'lucide-react';

function IntegrationsPanel({ onClose, onApplyIntegrations, isLoading }) {
    const [address, setAddress] = useState('');
    const [twitter, setTwitter] = useState('');
    const [instagram, setInstagram] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [facebook, setFacebook] = useState('');

    const handleSubmit = () => {
        let prompt = "Please update the website to include the following integrations seamlessly into the design:\\n";
        
        if (address.trim()) {
            prompt += `- Add a beautifully styled Google Maps iframe showing the location for: "${address.trim()}". Place it appropriately (e.g., in the Contact section or Footer).\\n`;
        }

        const socials = [];
        if (twitter.trim()) socials.push(`Twitter (${twitter.trim()})`);
        if (instagram.trim()) socials.push(`Instagram (${instagram.trim()})`);
        if (linkedin.trim()) socials.push(`LinkedIn (${linkedin.trim()})`);
        if (facebook.trim()) socials.push(`Facebook (${facebook.trim()})`);

        if (socials.length > 0) {
            prompt += `- Add clickable social media icons in the Footer or Header linking to the following profiles: ${socials.join(', ')}. Use modern SVG icons or font icons that match the site's theme. CRITICAL: You MUST add target="_blank" and rel="noopener noreferrer" to all of these anchor tags so they open in a new tab (bypassing iframe restrictions).\\n`;
        }

        if (!address.trim() && socials.length === 0) return;

        onApplyIntegrations(prompt);
    };

    const hasInput = address.trim() || twitter.trim() || instagram.trim() || linkedin.trim() || facebook.trim();

    return (
        <div className="flex flex-col h-full bg-zinc-900 border-l border-white/10 w-80 text-white relative z-[1]">
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    <Link2 size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Integrations</span>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-white/10" onClick={onClose}>
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Map Integration */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin size={16} className="text-emerald-400" />
                        <h3 className="text-sm font-semibold">Google Maps Embed</h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        Provide a physical address, and AI will embed an interactive map into your website.
                    </p>
                    <input
                        type="text"
                        placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 outline-none text-sm focus:border-emerald-500/50 transition-colors"
                    />
                </div>

                <div className="h-px bg-white/5" />

                {/* Social Media Integration */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <Link2 size={16} className="text-pink-400" />
                        <h3 className="text-sm font-semibold">Social Media Links</h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        Add links to your social profiles. AI will insert matching icons in the footer.
                    </p>
                    
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Twitter Profile URL"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none text-sm focus:border-pink-500/50 transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="Instagram Profile URL"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none text-sm focus:border-pink-500/50 transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="LinkedIn Profile URL"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none text-sm focus:border-pink-500/50 transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="Facebook Profile URL"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none text-sm focus:border-pink-500/50 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
                <button
                    onClick={handleSubmit}
                    disabled={!hasInput || isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Sparkles size={16} className="animate-pulse" />
                            Applying...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Send size={16} />
                            Add to Website
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default IntegrationsPanel;
