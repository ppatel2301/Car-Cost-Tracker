# Car Cost Tracker

Car Cost Tracker is a lightweight web app I started to explore how everyday car ownership data can be turned into something useful and easy to understand. The goal of the project is to gradually build toward a simple “all-in-one” view of a vehicle, including basic details, ownership context, and eventually cost estimates.

This is an early version focused on getting the core flow working end-to-end and shipping something usable quickly.

---

## What the app does right now

- Fetches real vehicle **makes and models** using the public NHTSA Vehicle API  
- Lets users select a **make, model, and optional year**  
- Saves selected vehicles to a local **garage list** using browser storage  
- Displays saved vehicles in a clean, simple UI  
- Handles loading states and basic error cases  

---

## Why I built this

I wanted to start a personal project that:
- Solves a real, everyday problem  
- Uses a public API and real data  
- Can grow over time instead of being a one-off demo  

Car ownership felt like a good domain to explore because it touches APIs, data validation, user experience, and future cost modeling. This project is also a way for me to practice shipping early and improving things incrementally.

---

## Tech stack

- HTML, CSS, and vanilla JavaScript  
- Public **NHTSA Vehicle API** (no authentication required)  
- Browser `localStorage` for persistence  
- GitHub Pages for hosting  

---

## Planned next steps

Some things I plan to add next:

- Basic monthly cost estimates (fuel, maintenance placeholders)  
- Better year-based filtering for vehicles  
- Simple charts to visualize ownership costs  
- Ability to compare two vehicles side by side  
- Improved error handling and UI polish  

The scope is intentionally realistic, with features added incrementally.

---

## Live demo

👉 **Live app:**  
_Link_Will_Be_Added_When_hosted_

---

## Notes

This project is still in active development. The current focus is on building a solid foundation before layering on more advanced features.