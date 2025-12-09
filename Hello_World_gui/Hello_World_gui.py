from tkinter import *
def click():
    but.destroy()
    disp=Label(root,text="Hello, World!",width=50,height=20,background="Black",foreground="Lime")
    disp.pack()
    
root=Tk()
#disp=Label(root,text="Hello, World!",width=50,height=20,background="Black",foreground="Lime")
but=Button(root,text="click me",command=click)
but.pack()




root.mainloop()
