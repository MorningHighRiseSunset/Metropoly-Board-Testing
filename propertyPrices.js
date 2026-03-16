// Realistic Monopoly property prices for 28 properties (in order of board)
// These are the classic US Monopoly prices, mapped to your propertyTiles order
// (Community Chest, Chance, Tax, corners are not properties)
//
// propertyTiles = [1,3,5,6,8,9,11,12,13,14,15,16,18,19,23,24,25,26,27,29,31,32,35,36,38,39]
//
// Index:  1   3   5   6   8   9   11  12  13  14  15  16  18  19  23  24  25  26  27  29  31  32  35  36  38  39
// Price: 60, 60,200,100,100,120,140,150,160,200,220,220,260,280,300,300,320,350,400,150,200,220,240,260,280,300
//
// We'll use this mapping in the code.
window.monopolyPropertyPrices = {
  1: 350,    // Las Vegas Raiders (Allegiant Stadium)
  3: 300,    // Las Vegas Grand Prix
  5: 250,    // Las Vegas Monorail
  6: 220,    // Speed Vegas Off Roading
  8: 275,    // Las Vegas Golden Knights
  9: 320,    // Maverick Helicopter Rides
  11: 200,   // Brothel
  12: 180,   // Electric Company
  13: 350,   // Bet MGM
  14: 250,   // Las Vegas Monorail
  15: 400,   // Bellagio
  16: 300,   // Las Vegas Aces
  18: 260,   // Horseback Riding
  19: 350,   // Resorts World Theatre
  23: 320,   // Wynn Las Vegas
  24: 300,   // Shriners Children's Open
  25: 320,   // Bachelor & Bachelorette Parties
  26: 350,   // Las Vegas Little White Wedding Chapel
  27: 400,   // Sphere
  29: 200,   // Water Works
  31: 420,   // Caesars Palace
  32: 350,   // Santa Fe Hotel and Casino
  35: 300,   // House of Blues
  36: 350,   // The Cosmopolitan
  38: 250,   // Las Vegas Monorail
  39: 275    // Speed Vegas Off Roading (or another property)
};
