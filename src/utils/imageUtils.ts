
export const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    console.log('Loading image from URL:', url);
    
    // Add cache busting parameter and CORS headers
    const response = await fetch(url + '?t=' + Date.now(), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch image, status:', response.status);
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Image blob received, size:', blob.size, 'type:', blob.type);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('Image converted to base64, length:', result.length);
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};
