# Kasturi Perfume Chatbot

print("============================================")
print("       WELCOME TO KASTURI PERFUME")
print("     Discover Your Signature Fragrance")
print("============================================")

name = input("\nBot: Please enter your name: ")
print("\nBot: Hello", name + "! Welcome to Kasturi Perfume.")

while True:

    print("\n=========== MAIN MENU ===========")
    print("1. Perfume Recommendations")
    print("2. Gift Suggestions")
    print("3. Bulk Orders and Return Gifts")
    print("4. Place a Customer Order")
    print("5. Exit")

    choice = input("\nBot: What would you like to explore? ").lower()

    # Perfume Recommendations
    if choice in ["1", "perfume recommendations"]:

        print("\nBot: Which fragrance type do you prefer?")
        print("1. Floral")
        print("2. Fresh")
        print("3. Sweet")
        print("4. Woody")
        print("5. Oriental and Spicy")

        fragrance = input("\nBot: Enter your choice: ").lower()

        if fragrance in ["1", "floral"]:
            print("\nBot: Floral Perfume Recommendations:")
            print("1. Gucci Flora")
            print("2. Mark Jecob")
            print("3. Chanel")
            print("4. Vanity")

        elif fragrance in ["2", "fresh"]:
            print("\nBot: Fresh Perfume Recommendations:")
            print("1. Cool Water")
            print("2. Legend")
            print("3. CR-7")
            print("4. Armani")

        elif fragrance in ["3", "sweet"]:
            print("\nBot: Sweet Perfume Recommendations:")
            print("1. Vanilla")
            print("2. Shabaya")
            print("3. One Million")
            print("4. Hawas Ice")

        elif fragrance in ["4", "woody"]:
            print("\nBot: Woody Perfume Recommendations:")
            print("1. White Oud")
            print("2. Purple Oud")
            print("3. Black Berry")
            print("4. Tomboy")

        elif fragrance in ["5", "oriental and spicy", "oriental", "spicy"]:
            print("\nBot: Oriental and Spicy Perfume Recommendations:")
            print("1. Shanaya")
            print("2. Magnet")
            print("3. Rolf Spicebomb")
            print("4. Tom Ford Tobacco Vanille")

        else:
            print("\nBot: Invalid fragrance choice. Please try again.")

        if fragrance in ["1", "floral"] or fragrance in ["2", "fresh"] or fragrance in ["3", "sweet"] or fragrance in ["4", "woody"] or fragrance in ["5", "oriental and spicy", "oriental", "spicy"]:
            print("\nBot: These are fragrance suggestions.")
            print("Bot: Please contact Kasturi Perfume to check availability.")
    
    # Gift Suggestions
    elif choice in ["2", "gift suggestions"]:

        print("\nBot: Who is the gift for?")
        print("1. Birthday")
        print("2. Anniversary")
        print("3. Wedding")
        print("4. Haldi or Mehndi")
        print("5. Return Gifts")

        occasion = input("\nBot: Choose an occasion: ").lower()

        if occasion in ["1", "birthday"]:
            print("\nBot: Birthday Gift Suggestions")
            print("- Perfume gift set")
            print("- Mini perfume collection")
            print("- Attar gift bottle with beautiful card")

        elif occasion in ["2", "anniversary"]:
            print("\nBot: Anniversary Gift Suggestions")
            print("- Elegant perfume pair")
            print("- Luxury fragrance gift set")
            print("- Personalized perfume hamper")

        elif occasion in ["3", "wedding"]:
            print("\nBot: Wedding Gift Suggestions")
            print("- Premium perfume hamper")
            print("- Perfume and attar combination")
            print("- Elegant fragrance gift box")

        elif occasion in ["4", "haldi", "mehndi", "haldi or mehndi"]:
            print("\nBot: Haldi and Mehndi Gift Suggestions")
            print("- Traditional attar bottles")
            print("- Floral fragrance gifts")
            print("- Colour-themed perfume hampers")

        elif occasion in ["5", "return gifts", "return gift"]:
            print("\nBot: Return Gift Suggestions")
            print("- Mini perfume bottles")
            print("- Attar bottles")
            print("- Customized fragrance gift cards")

        else:
            print("\nBot: Invalid occasion. Please try again.")

        print("Bot: These are the gift suggestions. Please contact Kasturi Perfume to check availability and price.")    

    # Bulk Orders and Return Gifts
    elif choice in ["3", "bulk orders and return gifts", "bulk orders", "return gifts"]:

        print("\nBot: Welcome to our Bulk Order Assistant!")

        event = input("Bot: What is your event? ")
        quantity = int(input("Bot: How many quantity do you need? "))
        budget = float(input("Bot: What is your budget per product in rupees? "))

        total_budget = quantity * budget

        print("\n============== BULK ORDER SUMMARY ==============")
        print("Customer Name: ", name)
        print("Event: ", event)
        print("Number of Gifts: ", quantity)
        print("Budget Per Gift: Rs.", budget)
        print("Estimated Total Budget: Rs.", total_budget)

        if quantity <= 0 or budget <= 0:
            print("Bot: Please enter a positive quantity and budget.")

        elif budget < 100:
            print("Bot: Consider small attar bottles or simple fragrance gifts.")

        elif budget <= 250:
            print("Bot: Consider mini perfumes and attar gift combinations.")

        elif budget <= 500:
            print("Bot: Consider premium perfume gift sets.")

        else:
            print("Bot: Consider luxury fragrance hampers.")

        print("Bot: Final pricing depends on product availability and customzation.")

    # Customer Orders
    elif choice in ["4", "place a customer order"]:

        print("\nBot: Welcome to Kasturi Perfume Ordering!")
        print("1. Perfume")
        print("2. Attar")
        print("3. Gift Hamper")

        product = input("Bot: What would you like to order? ")

        if product in ["1", "Perfume", "perfume"]:
            product_name = input("Bot: Enter the perfume name: ")
            size = input("Bot: Enter the bottle size in ml(10,20,50,100): ")
            quantity = int(input("Bot: How many bottles do you need? "))

            print("\nBot: Your perfume order summary:")
            print("Customer: ", name)
            print("Product: ", product_name)
            print("Bottle Size: ", size, "ml")
            print("Quantity: ", quantity)
            print("Bot: Please confirm the price with Kasturi Perfume.")

        elif product in ["2", "Attar", "attar"]:
            product_name = input("Bot: Enter the attar name: ")
            size = input("Bot: Enter the bottle in size in ml(3,10): ")
            quantity = int(input("Bot: How many bottles do you need? "))

            print("\nBot: Your attar order summary:")
            print("Customer: ", name)
            print("Product: ", product_name)
            print("Bottle Size: ", size, "ml")
            print("Quantity: ", quantity)
            print("Bot: Please confirm the price with Kasturi Perfume.")

        elif product in ["3", "Gift Hamper", "gift hamper"]:
            occasion = input("Bot: What is the occasion? ")
            quantity = int(input("Bot: How many hampers do you need? "))

            print("\nBot: Your gift hamper order summary:")
            print("Customer: ", name)
            print("Occasion: ", occasion)
            print("Quantity: ", quantity)
            print("Bot: Please confirm the price with Kasturi Perfume.")

        else:
            print("Bot: Invalid product choice. Please try again.")

    # Exit
    elif choice in ["5", "exit"]:
        print("\nBot:\nThank you for visiting Kasturi Perfume!")
        print("Stay fragrant and make every moment special.")
        print("Have a wonderful day, ", name + "!")
        break

    else:
        print("\nBot: Invalid choice. Please select an option from 1 to 5.")
