import { useRef } from "react";

export default function PostForm({ postText, setPostText, selectedImage, setSelectedImage, handleEnhance, loading }) {
    const fileInputRef = useRef();

    return (
        <div className="form-container">
            <textarea
                rows="8"
                placeholder="Type your post here..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
            />

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setSelectedImage(e.target.files[0])}
            />

            {selectedImage && (
                <p><strong>Image selected:</strong> {selectedImage.name}</p>
            )}

            <button onClick={handleEnhance} disabled={loading}>
                {loading ? "Enhancing..." : "Enhance & Generate"}
            </button>
        </div>
    );
}
