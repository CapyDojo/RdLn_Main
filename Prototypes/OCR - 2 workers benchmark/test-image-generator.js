/**
 * Test Image Generator
 * 
 * This script generates simple test images that can be used for OCR benchmarking.
 * These images contain randomized text that can be used to test OCR performance.
 */

/**
 * Generate a canvas with random text for OCR testing
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @param {string} text - Text to render on the canvas
 * @returns {HTMLCanvasElement} Canvas element with the rendered text
 */
function generateTestCanvas(width = 800, height = 600, text = '') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Fill background with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Set text properties
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Add some random text if none provided
    if (!text) {
        text = generateRandomText(200); // Generate 200 words of random text
    }
    
    // Split text into lines
    const lines = wrapText(ctx, text, width - 40);
    
    // Draw text lines
    let y = 20;
    lines.forEach(line => {
        ctx.fillText(line, 20, y);
        y += 30; // Line height
    });
    
    return canvas;
}

/**
 * Generate random text for testing
 * @param {number} wordCount - Number of words to generate
 * @returns {string} Random text
 */
function generateRandomText(wordCount) {
    const words = [
        'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
        'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
        'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
        'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
        'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut',
        'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
        'dolor', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum',
        'dolore', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
        'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
        'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];
    
    let result = '';
    for (let i = 0; i < wordCount; i++) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        result += randomWord + ' ';
        
        // Add punctuation occasionally
        if (Math.random() > 0.8) {
            result += '. ';
        }
        
        // Add newlines occasionally
        if (Math.random() > 0.9) {
            result += '\n';
        }
    }
    
    return result.trim();
}

/**
 * Wrap text to fit within a specified width
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width for text
 * @returns {string[]} Array of text lines
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    lines.push(currentLine);
    return lines;
}

/**
 * Convert canvas to Blob for use in OCR
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - MIME type (default: 'image/png')
 * @param {number} quality - Image quality for JPEG (0-1)
 * @returns {Promise<Blob>} Promise that resolves to a Blob
 */
function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
    });
}

/**
 * Generate a test image file
 * @param {string} filename - Name for the file
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to include
 * @returns {Promise<File>} Promise that resolves to a File object
 */
async function generateTestImageFile(filename = 'test-image.png', width = 800, height = 600, text = '') {
    const canvas = generateTestCanvas(width, height, text);
    const blob = await canvasToBlob(canvas, 'image/png');
    return new File([blob], filename, { type: 'image/png' });
}

// Example usage:
// const testImage = await generateTestImageFile('ocr-test-1.png', 800, 600, 'This is a test image for OCR benchmarking.');

// Export functions for use in other modules
// export { generateTestCanvas, generateRandomText, wrapText, canvasToBlob, generateTestImageFile };