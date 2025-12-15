// Simple clipboard-based DOCX text extraction
// This approach leverages the fact that Word already puts formatted text on the clipboard

class SimpleDocxExtractor {
  /**
   * Extract text from clipboard data that originated from DOCX
   * Takes advantage of the fact that Word puts formatted text on clipboard
   */
  static extractFromClipboard(clipboardData) {
    // Get available formats
    const formats = clipboardData.types || [];
    console.log('Available clipboard formats:', formats);
    
    // Try to get formatted text (this preserves list numbering)
    if (formats.includes('text/plain')) {
      return clipboardData.getData('text/plain');
    } else if (formats.includes('Text')) {
      return clipboardData.getData('Text');
    } else {
      // Fallback
      return clipboardData.getData('');
    }
  }
  
  /**
   * Extract text directly from a DOCX file with better list preservation
   * This is a simplified approach that focuses on preserving what Word already knows how to format
   */
  static async extractWithFormatting(file) {
    try {
      // Check if this is actually a DOCX file
      if (!file.type.includes('wordprocessingml') && !file.name.toLowerCase().endsWith('.docx')) {
        throw new Error('File is not a DOCX file');
      }
      
      // For now, we'll still use mammoth but with a focus on preserving formatting
      // In a real implementation, we might combine this with clipboard data when available
      
      // Import mammoth dynamically
      const mammoth = await import('https://cdn.jsdelivr.net/npm/mammoth@1.10.0/mammoth.browser.min.js');
      
      // Convert to HTML to preserve structure
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.default.convertToHtml({ arrayBuffer });
      
      // Create a temporary element to process the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result.value;
      
      // Extract text while preserving list structure
      const formattedText = this.htmlToListFormattedText(tempDiv);
      
      return {
        content: formattedText,
        hasLists: tempDiv.querySelectorAll('ol, ul').length > 0,
        processingTime: 0 // In a real implementation, we'd measure this
      };
      
    } catch (error) {
      console.error('Error extracting DOCX content:', error);
      throw error;
    }
  }
  
  /**
   * Convert HTML to text while preserving list formatting
   * This is a simplified version - a full implementation would be more sophisticated
   */
  static htmlToListFormattedText(element) {
    // Process ordered lists
    const orderedLists = element.querySelectorAll('ol');
    orderedLists.forEach((ol, olIndex) => {
      const listItems = ol.querySelectorAll('li');
      listItems.forEach((li, liIndex) => {
        // Add numbering (in a real implementation, we'd preserve the actual numbering format)
        const number = `${liIndex + 1}. `;
        li.prepend(document.createTextNode(number));
      });
    });
    
    // Process unordered lists
    const unorderedLists = element.querySelectorAll('ul');
    unorderedLists.forEach(ul => {
      const listItems = ul.querySelectorAll('li');
      listItems.forEach(li => {
        // Add bullet
        li.prepend(document.createTextNode('• '));
      });
    });
    
    // Return text content
    return element.textContent || element.innerText || '';
  }
}

// Example usage in a paste handler:
/*
document.addEventListener('paste', function(event) {
  const clipboardData = event.clipboardData || window.clipboardData;
  
  // Extract formatted text directly from clipboard
  const formattedText = SimpleDocxExtractor.extractFromClipboard(clipboardData);
  
  // Use the properly formatted text
  console.log('Formatted text from clipboard:', formattedText);
});
*/

// Example usage for file processing:
/*
async function handleDocxFile(file) {
  try {
    const result = await SimpleDocxExtractor.extractWithFormatting(file);
    console.log('Extracted content:', result.content);
    console.log('Has lists:', result.hasLists);
  } catch (error) {
    console.error('Failed to process DOCX file:', error);
  }
}
*/

export default SimpleDocxExtractor;