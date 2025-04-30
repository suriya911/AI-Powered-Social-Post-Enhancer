import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PostForm from "../components/PostForm";
import { useRouter } from "next/router";

export default function Home() {
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnhance = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("text", postText);
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/enhance`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      // Validate and format hashtags
      const formattedHashtags = Array.isArray(data.hashtags)
        ? data.hashtags
          .filter(tag => tag && (typeof tag === 'string' || (typeof tag === 'object' && tag.text)))
          .map(tag => {
            // If tag is a string, convert to object
            if (typeof tag === 'string') {
              const cleanTag = tag.replace(/^#+/, '').trim();
              return cleanTag ? {
                text: cleanTag,
                selected: true
              } : null;
            }
            // If tag is an object, ensure proper format
            if (typeof tag === 'object' && tag !== null) {
              const cleanTag = String(tag.text || '').replace(/^#+/, '').trim();
              return cleanTag ? {
                text: cleanTag,
                selected: typeof tag.selected === 'boolean' ? tag.selected : true
              } : null;
            }
            return null;
          })
          .filter(Boolean) // Remove null values
        : [];

      // Store the enhanced text and formatted hashtags
      localStorage.setItem("enhancedText", data.enhanced_text || '');
      localStorage.setItem("hashtags", JSON.stringify(formattedHashtags));
      localStorage.setItem("imageUrl", data.image_url || "");

      router.push("/review");
    } catch (error) {
      console.error("Enhancement error:", error);
      alert("Failed to enhance the post. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="main-container">
        <PostForm
          postText={postText}
          setPostText={setPostText}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          handleEnhance={handleEnhance}
          loading={loading}
        />
      </main>
      <Footer />
    </>
  );
}
