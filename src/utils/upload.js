export async function uploadToImageKit(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Choose endpoint based on file type
  let endpoint = "http://localhost:5000/api/upload";
  if (file.type && file.type.startsWith("audio/")) {
    endpoint = "http://localhost:5000/api/upload-audio";
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
