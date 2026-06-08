export async function parseApiJson<T>(response: Response): Promise<T> {
  const raw = await response.text();

  if (!raw) {
    throw new Error("Empty response from server.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    if (raw.includes("<!DOCTYPE html>") || raw.includes("<html")) {
      throw new Error("Server error while processing the photo. Try a smaller or clearer image.");
    }
    throw new Error("Could not read server response. Please try again.");
  }
}
