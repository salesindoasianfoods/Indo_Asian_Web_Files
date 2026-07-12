import fitz
import os
import re
from PIL import Image
import io

pdf_path = r"d:\Fenar\Web_Works\Indo_Asian\Indo_Asian_DC\products-ref\Viswas Product Catalogue.pdf"
output_dir = r"d:\Fenar\Web_Works\Indo_Asian\Indo_Asian_DC\extracted_images"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def clean_filename(name):
    # Remove invalid characters for filenames
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace("\n", " ").strip()
    return name

def main():
    print(f"Opening PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Get all text blocks on the page
        # dict structure: { "blocks": [ { "bbox": (x0, y0, x1, y1), "lines": [...] } ] }
        text_dict = page.get_text("dict")
        blocks = [b for b in text_dict.get("blocks", []) if b.get("type") == 0] # type 0 is text
        
        # Extract plain text with coordinates
        text_items = []
        for b in blocks:
            text = ""
            for l in b.get("lines", []):
                for s in l.get("spans", []):
                    text += s.get("text", "") + " "
            text = text.strip()
            if text:
                text_items.append({
                    "text": text,
                    "bbox": b["bbox"] # (x0, y0, x1, y1)
                })
        
        # Get all images
        image_list = page.get_images(full=True)
        print(f"Page {page_num + 1}: Found {len(image_list)} images.")
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            # Get image bounding box
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            
            img_rect = rects[0] # Take the first occurrence (x0, y0, x1, y1)
            
            # Find text blocks that are directly below this image
            associated_texts = []
            
            for ti in text_items:
                t_rect = ti["bbox"]
                
                # Check if text is BELOW the image (allow small overlap)
                if t_rect[1] >= img_rect[3] - 20: 
                    y_dist = t_rect[1] - img_rect[3]
                    
                    # Check horizontal overlap
                    # The text should intersect the vertical column of the image at least partially
                    img_left = img_rect[0]
                    img_right = img_rect[2]
                    
                    if not (t_rect[2] < img_left or t_rect[0] > img_right):
                        if y_dist < 200: # max distance 200px
                            associated_texts.append((y_dist, ti["text"]))
                            
            # Sort by vertical distance (closest first)
            associated_texts.sort(key=lambda x: x[0])
            
            # Take the first 2 text blocks (usually Title and Weight)
            closest_text = " ".join([t[1] for t in associated_texts[:2]])

            # If no text found exactly underneath, maybe there's a second block (weight)?
            # Actually, the block itself might contain the name AND weight if they are grouped.
            
            # Extract image data
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            if len(image_bytes) < 5000:
                # Skip tiny images (likely logos, icons, borders)
                continue
                
            try:
                # Optimize with Pillow
                img_pil = Image.open(io.BytesIO(image_bytes))
                
                # If RGB format is missing (e.g. CMYK), convert to RGB
                if img_pil.mode != "RGB" and img_pil.mode != "RGBA":
                    img_pil = img_pil.convert("RGB")
                    
                file_name = f"page{page_num+1}_img{img_index+1}"
                if closest_text:
                    file_name = clean_filename(closest_text)[:100]
                
                output_path = os.path.join(output_dir, f"{file_name}.webp")
                
                # Avoid overwriting
                counter = 1
                while os.path.exists(output_path):
                    output_path = os.path.join(output_dir, f"{file_name}_{counter}.webp")
                    counter += 1
                
                img_pil.save(output_path, "webp", quality=85)
                print(f"Saved: {output_path}")
            except Exception as e:
                print(f"Error saving image on page {page_num+1}: {e}")

if __name__ == "__main__":
    main()
