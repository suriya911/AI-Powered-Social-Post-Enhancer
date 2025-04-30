import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewForm from "../components/ReviewForm";

export default function Review() {
    const [isClient, setIsClient] = useState(false);
    const [enhancedText, setEnhancedText] = useState("");
    const [hashtags, setHashtags] = useState([]);
    const [customTag, setCustomTag] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        setIsClient(true);
        try {
            // Handle enhanced text
            const storedText = localStorage.getItem("enhancedText");
            if (storedText) {
                try {
                    const parsed = JSON.parse(storedText);
                    let text = typeof parsed === "string" ? parsed : parsed?.text || "";

                    // Remove hashtags from the enhanced text
                    text = text.replace(/#\w+/g, '').trim();
                    setEnhancedText(text);
                } catch (err) {
                    const text = storedText.replace(/#\w+/g, '').trim();
                    setEnhancedText(text);
                }
            }

            // Handle hashtags
            const storedTags = localStorage.getItem("hashtags");
            if (storedTags) {
                try {
                    let parsedTags = JSON.parse(storedTags);

                    // Extract hashtags from enhanced text if no stored tags
                    if (!parsedTags || !parsedTags.length) {
                        const storedText = localStorage.getItem("enhancedText");
                        if (storedText) {
                            const hashtagMatches = storedText.match(/#[\w\u0080-\uFFFF]+/g) || [];
                            parsedTags = hashtagMatches.map(tag => ({
                                text: tag.replace(/^#+/, ''),
                                selected: true
                            }));
                        }
                    }

                    // Convert hashtags to proper format
                    if (Array.isArray(parsedTags)) {
                        parsedTags = parsedTags
                            .map(tag => {
                                if (!tag) return null;

                                // Handle string tags
                                if (typeof tag === 'string') {
                                    const cleanTag = tag.replace(/^#+/, '').trim();
                                    return cleanTag ? { text: cleanTag, selected: true } : null;
                                }

                                // Handle object tags
                                if (typeof tag === 'object' && tag !== null) {
                                    const text = String(tag.text || '').replace(/^#+/, '').trim();
                                    return text ? {
                                        text,
                                        selected: Boolean(tag.selected)
                                    } : null;
                                }

                                return null;
                            })
                            .filter(Boolean); // Remove null values
                    } else {
                        parsedTags = [];
                    }

                    setHashtags(parsedTags);
                } catch (err) {
                    console.error("Error parsing hashtags:", err);
                    setHashtags([]);
                }
            }

            // Handle image URL
            const storedImageUrl = localStorage.getItem("imageUrl");
            if (storedImageUrl) {
                setImageUrl(storedImageUrl);
            }
        } catch (err) {
            console.error("Error loading data from localStorage:", err);
        }
    }, []);

    const addCustomTag = () => {
        if (customTag.trim()) {
            const cleanTag = customTag.trim().replace(/^#+/, '');
            if (cleanTag) {
                const newTag = {
                    text: cleanTag,
                    selected: true
                };
                setHashtags(prev => Array.isArray(prev) ? [...prev, newTag] : [newTag]);
                setCustomTag("");
            }
        }
    };

    const handlePost = () => {
        if (!selectedPlatform) {
            alert("Please select a platform!");
            return;
        }

        const selectedTags = (Array.isArray(hashtags) ? hashtags : [])
            .filter(tag => tag && tag.selected && tag.text)
            .map(tag => {
                const cleanTag = tag.text.replace(/^#+/, '').trim();
                return cleanTag ? `#${cleanTag}` : '';
            })
            .filter(Boolean);

        const finalPost = `${enhancedText}\n\n${selectedTags.join(" ")}`;

        let url = "";

        switch (selectedPlatform) {
            case "Twitter (X)":
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalPost)}`;
                break;
            case "LinkedIn":
                url = `https://www.linkedin.com/shareArticle?mini=true&summary=${encodeURIComponent(finalPost)}`;
                break;
            case "Facebook":
                url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(finalPost)}`;
                break;
            case "Instagram":
            case "Threads":
                url = "https://www.instagram.com"; // or Threads.net
                alert("Copy your enhanced post manually and paste it into Instagram/Threads.");
                break;
            default:
                alert("Unsupported platform selected.");
                return;
        }

        if (url) {
            window.open(url, "_blank");
        }
    };


    if (!isClient) {
        return (
            <>
                <Header />
                <main className="main-container">
                    <div>Loading...</div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="main-container">
                <ReviewForm
                    enhancedText={enhancedText || ""}
                    hashtags={Array.isArray(hashtags) ? hashtags : []}
                    setHashtags={setHashtags}
                    customTag={customTag || ""}
                    setCustomTag={setCustomTag}
                    addCustomTag={addCustomTag}
                    selectedPlatform={selectedPlatform || ""}
                    setSelectedPlatform={setSelectedPlatform}
                    handlePost={handlePost}
                    imageUrl={imageUrl || ""}
                />
            </main>
            <Footer />
        </>
    );
}
