/* Fictional mock data for the RentalOS static demo. "Sunset Event Rentals" does not exist. */
window.BS_DATA = (function () {
  const cat = ['Tents', 'Tables', 'Chairs', 'Linens', 'Lighting', 'Staging', 'Dance Floors', 'Tableware', 'Heating & Cooling', 'Concessions'];
  const icon = { Tents: '⛺', Tables: '🪑', Chairs: '💺', Linens: '🧵', Lighting: '💡', Staging: '🎤', 'Dance Floors': '🪩', Tableware: '🍽️', 'Heating & Cooling': '🌡️', Concessions: '🍿' };
  const items = [
    ['20x20 Frame Tent', 'Tents', 650, 6, 'Heavy-duty frame tent, sidewalls sold separately.'],
    ['20x40 Pole Tent', 'Tents', 1250, 3, 'Classic white pole tent, seats 80.'],
    ['40x80 Clearspan Tent', 'Tents', 4800, 1, 'Clearspan structure, ideal for weddings up to 300.'],
    ['60" Round Table', 'Tables', 12, 60, 'Seats 8-10 guests.'],
    ['8ft Banquet Table', 'Tables', 10, 48, 'Folding, seats 8.'],
    ['Cocktail Table (42")', 'Tables', 18, 24, 'High-top, linen sold separately.'],
    ['White Padded Folding Chair', 'Chairs', 2.5, 400, 'Padded seat, resin frame.'],
    ['Gold Chiavari Chair', 'Chairs', 6, 220, 'Includes cushion.'],
    ['120" Round Linen - Ivory', 'Linens', 14, 80, 'Polyester, wrinkle-resistant.'],
    ['Napkins (dozen)', 'Linens', 6, 150, 'Assorted colors.'],
    ['String Lights (100 ft)', 'Lighting', 45, 30, 'Warm white, commercial grade.'],
    ['Uplight (LED, battery)', 'Lighting', 22, 40, 'Wireless, 16 colors.'],
    ['Chandelier (Crystal)', 'Lighting', 140, 8, 'Tent-rated, requires rigging.'],
    ['4x8 Stage Deck', 'Staging', 55, 24, 'Adjustable height 8-24".'],
    ['16x16 Dance Floor', 'Dance Floors', 480, 3, 'Interlocking white vinyl.'],
    ['Dinner Plate (case of 25)', 'Tableware', 18, 40, 'White bone china.'],
    ['Flatware Set (case of 25)', 'Tableware', 16, 40, 'Stainless 5-piece settings.'],
    ['Patio Heater', 'Heating & Cooling', 95, 12, 'Propane, 40,000 BTU.'],
    ['Spot Cooler', 'Heating & Cooling', 150, 6, 'Portable, 12,000 BTU.'],
    ['Popcorn Machine', 'Concessions', 85, 4, 'Includes first 20 servings.'],
  ].map((r, i) => ({ id: 'i' + (i + 1), name: r[0], category: r[1], price: r[2], stock: r[3], desc: r[4], icon: icon[r[1]], sku: 'SER-' + String(1000 + i * 7) }));

  const dayOffset = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
  // line items: [itemId, qty]
  const quotes = [
    { id: 'Q-2041', name: 'Hartwell Wedding', client: 'Emma Hartwell', email: 'emma@example.com', phone: '555-010-2041', venue: 'Maple Grove Estate', date: dayOffset(12), status: 'approved', signed: true, discount: 0, lines: [['i3', 1], ['i4', 30], ['i8', 220], ['i9', 30], ['i11', 6], ['i15', 1], ['i14', 6]], thread: [['client', 'Emma', 'Can we add heaters for the evening?'], ['staff', 'Joe', 'Absolutely, I added 4 patio heaters. Updated quote is ready to review.']] },
    { id: 'Q-2042', name: 'Riverside Corporate Picnic', client: 'Dana Ortiz', email: 'dana@example.com', phone: '555-010-2042', venue: 'Riverside Park', date: dayOffset(5), status: 'sent', signed: false, discount: 5, lines: [['i2', 2], ['i5', 24], ['i7', 160], ['i20', 1], ['i18', 4]], thread: [['client', 'Dana', 'Does the price include delivery and setup?']] },
    { id: 'Q-2043', name: 'Chen 50th Birthday', client: 'Marcus Chen', email: 'marcus@example.com', phone: '555-010-2043', venue: 'Private residence', date: dayOffset(19), status: 'draft', signed: false, discount: 0, lines: [['i1', 1], ['i4', 10], ['i7', 60], ['i12', 12]], thread: [] },
    { id: 'Q-2044', name: 'Oakview Gala', client: 'Priya Natarajan', email: 'priya@example.com', phone: '555-010-2044', venue: 'Oakview Hall', date: dayOffset(12), status: 'sent', signed: false, discount: 0, lines: [['i3', 1], ['i4', 30], ['i8', 200], ['i13', 2]], thread: [] },
    { id: 'Q-2039', name: 'Lakeside Reunion', client: 'Tom Alvarez', email: 'tom@example.com', phone: '555-010-2039', venue: 'Lakeside Pavilion', date: dayOffset(-8), status: 'completed', signed: true, discount: 0, lines: [['i1', 1], ['i5', 12], ['i7', 90]], thread: [] },
  ];

  const leads = [
    { id: 'L-301', name: 'Grace Whitfield', source: 'Website form', event: 'Wedding · 140 guests', date: dayOffset(60), status: 'new' },
    { id: 'L-302', name: 'Brightpath School PTA', source: 'Referral', event: 'Spring Carnival · 400 guests', date: dayOffset(95), status: 'new' },
    { id: 'L-303', name: 'Noah Kim', source: 'Goodshuffle import', event: 'Graduation party · 60 guests', date: dayOffset(33), status: 'contacted' },
  ];

  const team = [
    { name: 'Joe W.', role: 'Owner / admin', presence: 'online', page: 'Dashboard' },
    { name: 'Alex R.', role: 'Sales', presence: 'online', page: 'Quote Q-2042' },
    { name: 'Morgan T.', role: 'Warehouse lead', presence: 'away', page: 'Pull sheets' },
    { name: 'Sam P.', role: 'Delivery', presence: 'offline', page: '—' },
  ];

  const chat = [['Alex R.', '10:12', 'Riverside picnic is waiting on the revised tent count.'], ['Morgan T.', '10:15', 'We are short on 20x40 poles that weekend — checking subrental.'], ['Joe W.', '10:20', 'Use the vendor list, Peak Tent has them.']];

  return { cat, items, quotes, leads, team, chat, company: 'Sunset Event Rentals', today: new Date().toISOString().slice(0, 10) };
})();
