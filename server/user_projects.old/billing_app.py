import customtkinter as ctk 
from tkinter import messagebox

# --- User Database ---
# Note: In a real app, passwords should be securely hashed!
USER_PROFILES = {
    "Client A": "pass123",
    "Client B": "secure99",
    "JRR Tech": "admin"
}

# --- Product Database ---
PRODUCTS = {
    "1": {"name": "Thumbs Up Small", "price": 20.00},
    "2": {"name": "Samosa", "price": 15.00},
    "3": {"name": "Veg Puff", "price": 18.00},
    "10": {"name": "Coffee", "price": 25.00},
    "11": {"name": "Tea", "price": 12.00},
}

# --- Global Bill Variables ---
current_bill = []
total_amount = 0.0

# --- Main Billing Application Window (with True Fullscreen) ---
class BillingApp:
    def __init__(self, root, username):
        self.root = root
        self.root.title("JRR Canteen Billing")
        
        # --- TRUE FULLSCREEN FIX (Kiosk Mode) ---
        # 1. Get the screen's true dimensions
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        
        # 2. Remove all window decorations (title bar, taskbar, borders)
        self.root.overrideredirect(True) 
        
        # 3. Manually set the geometry to cover the *entire* screen (0+0 is top-left corner)
        self.root.geometry(f"{screen_width}x{screen_height}+0+0")
        # --------------------------------------------------------
        
        # We use a CTkFrame to help center the content
        self.main_frame = ctk.CTkFrame(self.root)
        self.main_frame.pack(expand=True)

        # Creative Branding
        self.brand_label = ctk.CTkLabel(self.main_frame, text="JRR TECH SOLUTIONS", 
                                        font=ctk.CTkFont(size=32, weight="bold"))
        self.brand_label.pack(pady=(20, 10))
        
        self.welcome_label = ctk.CTkLabel(self.main_frame, text=f"Welcome, {username}", 
                                          font=ctk.CTkFont(size=16))
        self.welcome_label.pack(pady=(0, 20))

        # UI Elements
        self.code_label = ctk.CTkLabel(self.main_frame, text="Item Code:", font=ctk.CTkFont(size=14))
        self.code_label.pack()
        self.code_entry = ctk.CTkEntry(self.main_frame, font=ctk.CTkFont(size=14), width=300)
        self.code_entry.pack(pady=5)
        self.code_entry.focus_set() 

        self.qty_label = ctk.CTkLabel(self.main_frame, text="Quantity:", font=ctk.CTkFont(size=14))
        self.qty_label.pack()
        self.qty_entry = ctk.CTkEntry(self.main_frame, font=ctk.CTkFont(size=14), width=300)
        self.qty_entry.pack(pady=5)

        self.bill_display = ctk.CTkTextbox(self.main_frame, height=250, width=500, 
                                           font=ctk.CTkFont(family="Courier", size=12))
        self.bill_display.pack(pady=10, padx=20)
        self.bill_display.configure(state="disabled") 
        
        self.total_label = ctk.CTkLabel(self.main_frame, text="Total: ₹0.00", 
                                        font=ctk.CTkFont(size=24, weight="bold"),
                                        text_color="#98c379") 
        self.total_label.pack(pady=10)
        
        # Button to exit the app (Critical for Kiosk Mode)
        self.exit_button = ctk.CTkButton(self.root, text="Exit App (Esc)", 
                                         command=self.exit_app)
        self.exit_button.place(relx=0.98, rely=0.02, anchor="ne")

        # Bindings
        self.code_entry.bind("<Return>", self.focus_on_quantity)
        self.qty_entry.bind("<Return>", self.add_item_to_bill)
        
        self.root.bind("<p>", self.print_bill)
        self.root.bind("<Escape>", self.exit_app) # Esc now closes the app

    def focus_on_quantity(self, event):
        self.qty_entry.focus_set()

    def add_item_to_bill(self, event):
        global total_amount
        code = self.code_entry.get()
        quantity_str = self.qty_entry.get()

        if code in PRODUCTS and quantity_str.isdigit() and int(quantity_str) > 0:
            item = PRODUCTS[code]
            quantity = int(quantity_str)
            sub_total = item["price"] * quantity

            bill_item = {"name": item["name"], "qty": quantity, "sub_total": sub_total}
            current_bill.append(bill_item)
            total_amount += sub_total
            
            self.update_bill_display()
        else:
            messagebox.showerror("Error", "Invalid Code or Quantity")

        self.code_entry.delete(0, "end")
        self.qty_entry.delete(0, "end")
        self.code_entry.focus_set()
        
    def update_bill_display(self):
        self.bill_display.configure(state="normal")
        self.bill_display.delete('1.0', "end") 
        for item in current_bill:
            line = f"{item['name']:<25} x {item['qty']:<5} ₹{item['sub_total']:.2f}\n"
            self.bill_display.insert("end", line)
        self.bill_display.configure(state="disabled")
        
        self.total_label.configure(text=f"Total: ₹{total_amount:.2f}")

    def print_bill(self, event):
        global current_bill, total_amount
        
        # Placeholder for real printing (e.g., python-escpos library)
        bill_content = self.bill_display.get("1.0", "end-1c")
        final_total = self.total_label.cget("text")
        
        print("--JRR TECH SOLUTIONS--")
        print("--- PRINTING BILL ---")
        print(bill_content)
        print(final_total)
        print("---------------------")
        
        messagebox.showinfo("Print", "Bill sent to printer (check console).")
        
        # Reset for new bill
        current_bill = []
        total_amount = 0.0
        self.update_bill_display()
        self.code_entry.focus_set()
        
    def exit_app(self, event=None):
        if messagebox.askyesno("Exit Application", "Are you sure you want to quit?"):
            self.root.destroy()

# --- Login Window ---
class LoginWindow:
    def __init__(self, root):
        self.root = root
        self.root.title("JRR Tech Solutions - Client Login")
        self.root.geometry("400x350")

        self.frame = ctk.CTkFrame(self.root)
        self.frame.pack(pady=20, padx=60, fill="both", expand=True)

        self.label = ctk.CTkLabel(self.frame, text="Client Login", 
                                  font=ctk.CTkFont(size=20, weight="bold"))
        self.label.pack(pady=30)

        # Dropdown for profiles
        self.user_var = ctk.StringVar(value="Select Profile")
        self.user_menu = ctk.CTkOptionMenu(self.frame, variable=self.user_var, 
                                           values=list(USER_PROFILES.keys()),
                                           font=ctk.CTkFont(size=14))
        self.user_menu.pack(pady=10)

        self.pass_entry = ctk.CTkEntry(self.frame, placeholder_text="Password", 
                                       show="*", font=ctk.CTkFont(size=14))
        self.pass_entry.pack(pady=10)
        self.pass_entry.bind("<Return>", self.check_login)

        self.login_button = ctk.CTkButton(self.frame, text="Login", 
                                          font=ctk.CTkFont(size=14, weight="bold"),
                                          command=self.check_login)
        self.login_button.pack(pady=20)
        
        self.root.eval('tk::PlaceWindow . center')

    def check_login(self, event=None):
        username = self.user_var.get()
        password = self.pass_entry.get()

        if username == "Select Profile":
            messagebox.showerror("Login Error", "Please select a profile.")
            return

        if USER_PROFILES.get(username) == password:
            self.root.destroy() # Close login window
            
            # Create a new main application window
            main_app_window = ctk.CTk() 
            app = BillingApp(main_app_window, username)
            
            # This line keeps the new billing window open
            main_app_window.mainloop() 

        else:
            messagebox.showerror("Login Error", "Invalid Profile or Password")
            self.pass_entry.delete(0, "end")

# --- Run the application ---
if __name__ == "__main__":
    ctk.set_appearance_mode("dark") 
    ctk.set_default_color_theme("blue") 

    login_root = ctk.CTk()
    app = LoginWindow(login_root)
    login_root.mainloop()