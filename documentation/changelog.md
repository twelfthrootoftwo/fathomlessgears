# Changelog

## Version 0.1:
* Character sheets for fish and fishers
* Fish types and sizes can be set, which will set:
    * Default attribute values
    * Hit location & column rolls
* Attack rolls (Close, Far, Mental) will check for a targeted token and, if found, automatically roll against the target's Evade/Willpower and will roll hit location if the attack hits
* Simple styling for character sheets and rolls
* Ballast calculation and initiative roll

## Version 0.2
* Complete overhaul of actor sheets
* Upload the official .fsh data file to access frames/size categories and internals for both fish and fishers
* Utility functions for scanning and weight calculations
* Roll intercept dialog to view applied modifiers, and adjust modifiers/die count before rolling

## Version 0.2.1
User testing performed on this patch!
* Updated internal import to accommodate new .fsh format for action text & attacks
* Tweaks to chat message display of attacks
* Fix update process for new item import process
* Attributes properly cap on actor sheet

## Version 0.2.2
* Add pointer & loading feedback for fsh import
* Bug fixes
* Improved internal message layout

## Version 0.2.3
* Fix bugs around custom bonuses in roll dialog & sheet
* Expandable rolls in chat messages