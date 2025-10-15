#!/usr/bin/env python3
"""
Script to help prepare your eyeglass frames folder for intelligent bulk upload.
This script will analyze your folder structure and provide recommendations.
"""

import os
import zipfile
import json
from pathlib import Path

def analyze_folder_structure(folder_path):
    """Analyze the folder structure and provide insights"""
    structure = {}
    total_files = 0
    total_dirs = 0
    
    for root, dirs, files in os.walk(folder_path):
        level = root.replace(folder_path, '').count(os.sep)
        indent = ' ' * 2 * level
        rel_path = os.path.relpath(root, folder_path)
        
        if rel_path == '.':
            rel_path = 'ROOT'
        
        structure[rel_path] = {
            'directories': len(dirs),
            'files': len([f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]),
            'image_files': [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]
        }
        
        total_files += len([f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))])
        total_dirs += len(dirs)
    
    return structure, total_files, total_dirs

def create_zip_archive(folder_path, output_path):
    """Create a ZIP archive of the folder"""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, folder_path)
                zipf.write(file_path, arcname)
    
    return os.path.getsize(output_path)

def main():
    # Your folder path
    folder_path = r"C:\Users\prota\Downloads\Eyeglass_Frames-20251005T184121Z-1-001\Eyeglass_Frames"
    
    if not os.path.exists(folder_path):
        print(f"❌ Folder not found: {folder_path}")
        return
    
    print("🔍 Analyzing your eyeglass frames folder...")
    print("=" * 60)
    
    # Analyze structure
    structure, total_files, total_dirs = analyze_folder_structure(folder_path)
    
    # Print analysis
    print(f"📊 Analysis Results:")
    print(f"   Total image files: {total_files}")
    print(f"   Total directories: {total_dirs}")
    print()
    
    print("📁 Folder Structure:")
    for path, info in structure.items():
        if info['files'] > 0 or info['directories'] > 0:
            print(f"   {path}/")
            if info['files'] > 0:
                print(f"     📸 {info['files']} image files")
            if info['directories'] > 0:
                print(f"     📁 {info['directories']} subdirectories")
    
    print()
    print("🎯 Intelligent Upload Capabilities:")
    print("   ✅ Branded frames (Brand → Shape → Color)")
    print("   ✅ Non-branded frames (Shape → Color)")
    print("   ✅ Contact lenses (Numbered images)")
    print("   ✅ Solutions (Numbered images)")
    print("   ✅ Sunglasses (Branded & Non-branded)")
    
    print()
    print("📦 Creating ZIP archive for upload...")
    
    # Create ZIP file
    output_zip = "eyeglass_frames_organized.zip"
    zip_size = create_zip_archive(folder_path, output_zip)
    
    print(f"✅ ZIP file created: {output_zip}")
    print(f"   Size: {zip_size / (1024*1024):.2f} MB")
    
    print()
    print("🚀 Ready for Intelligent Upload!")
    print("   • Upload the ZIP file using the Intelligent Bulk Upload feature")
    print("   • The AI will automatically categorize all products")
    print("   • Set default prices and stock quantities")
    print("   • Review and approve the created products")
    
    print()
    print("💡 Recommendations:")
    print("   • Set a default price (e.g., ₱500-2000 for frames)")
    print("   • Set default stock (e.g., 10-50 units)")
    print("   • Review product names and descriptions after upload")
    print("   • Update prices based on brand and quality")

if __name__ == "__main__":
    main()




