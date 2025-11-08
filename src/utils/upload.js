import apiClient from "../lib/apiClient";

export async function uploadToImageKit(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Choose endpoint based on file type
  let endpoint = "/api/upload";
  if (file.type && file.type.startsWith("audio/")) {
    endpoint = "/api/upload-audio";
  }

  try {
    const response = await apiClient.post(
      endpoint,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    const { url } = response.data ?? {};
    if (!url) {
      console.error("ImageKit error:", response.data);
      throw new Error("Image upload failed");
    }
    return url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
