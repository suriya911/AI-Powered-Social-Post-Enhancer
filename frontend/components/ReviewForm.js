import { useState, useEffect } from "react";

export default function ReviewForm({
    enhancedText = "",
    hashtags = [],
    setHashtags,
    customTag = "",
    setCustomTag,
    addCustomTag,
    selectedPlatform = "",
    setSelectedPlatform,
    handlePost,
    imageUrl = ""
}) {
    const platforms = ["LinkedIn", "Twitter (X)", "Facebook", "Instagram(coming soon)", "Threads(coming soon)", "Many more..."];
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTag = (index) => {
        if (!Array.isArray(hashtags) || index < 0 || index >= hashtags.length) return;

        const updated = hashtags.map((tag, i) => {
            if (i !== index) return tag;
            return {
                ...tag,
                selected: !tag.selected
            };
        });
        setHashtags(updated);
    };

    // Clean and format hashtag text
    const formatHashtag = (tag) => {
        if (!tag || typeof tag !== 'object' || !tag.text) return null;
        const cleanText = String(tag.text).replace(/^#+/, '').trim();
        return cleanText ? `#${cleanText}` : null;
    };

    if (!mounted) {
        return <div className="review-container">Loading form...</div>;
    }

    // Ensure hashtags are valid objects with text property
    const validHashtags = Array.isArray(hashtags)
        ? hashtags.filter(tag => tag && typeof tag === 'object' && tag.text)
        : [];

    return (
        <div className="review-container">
            <h2>Enhanced Post ✨</h2>
            {console.log("enhancedText value:", enhancedText)}
            <p className="enhanced-text">
                {enhancedText || "⚠️ No enhanced text available."}
            </p>

            {imageUrl && (
                <div style={{ marginTop: "1rem" }}>
                    <img src={imageUrl} alt="Uploaded" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                </div>
            )}

            <h3>Suggested Hashtags:</h3>
            <div className="hashtags">
                {validHashtags.map((tag, idx) => {
                    const formattedTag = formatHashtag(tag);
                    if (!formattedTag) return null;

                    return (
                        <label key={`${formattedTag}-${idx}`} className="tag">
                            <input
                                type="checkbox"
                                checked={Boolean(tag.selected)}
                                onChange={() => toggleTag(idx)}
                            />
                            <span>{formattedTag}</span>
                        </label>
                    );
                })}
            </div>

            <div className="custom-tag">
                <input
                    type="text"
                    placeholder="Add custom tag (without #)"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value.replace(/^#+/, ''))}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && customTag.trim()) {
                            e.preventDefault();
                            addCustomTag();
                        }
                    }}
                />
                <button onClick={addCustomTag}>+</button>
            </div>

            <div className="platform-select">
                <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                >
                    <option value="">Select Platform</option>
                    {platforms.map((platform) => (
                        <option key={platform} value={platform}>{platform}</option>
                    ))}
                </select>
            </div>

            <button className="post-button" onClick={handlePost}>
                Post to {selectedPlatform || "selected platform"}
            </button>
        </div>
    );
}
