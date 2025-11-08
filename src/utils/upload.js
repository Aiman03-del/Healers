const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function uploadToImageKit(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Choose endpoint based on file type
  let endpoint = `${API_BASE_URL}/api/upload`;
  if (file.type && file.type.startsWith("audio/")) {
    endpoint = `${API_BASE_URL}/api/upload-audio`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!data.url) {
      console.error("ImageKit error:", data);
      throw new Error("Image upload failed");
    }
    return data.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
