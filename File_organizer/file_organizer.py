import os
import shutil

files_categories={
    "images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"],
    "videos": [".mp4", ".mkv", ".flv", ".avi", ".mov"],
    "documents": [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx", ".xls", ".xlsx"],
    "audio": [".mp3", ".wav", ".aac", ".flac"],
    "archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "data": [".csv", ".json", ".xml"],
    "others": []
    
}

def organizer(directory):
    
    if not os.path.isdir(directory):
        print(f"{directory} is not an valid directory")
        return 
    
    
    for  files in files_categories:
        filepath=os.path.join(directory,files)
        os.makedirs(filepath,exist_ok=True)
    
    
    for filename in os.listdir(directory):
        
        file_path=os.path.join(directory,filename)
        if os.path.isdir(file_path):
            continue
        file_move=False
        
        for category,extension in files_categories.items():
            if any(filename.lower().endswith(ext) for ext in extension):
                shutil.move(file_path,os.path.join(directory,category,filename))
                file_move=True
                break
            
        if not  file_move:
            shutil.move(filename,os.path.join(directory,"others",file_path))
    print("organized successfully")
                  
directory=input("Enter the directory ")
organizer(directory)
