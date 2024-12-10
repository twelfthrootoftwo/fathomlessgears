# Changelog

## Version 0.1:

- Character sheets for fish and fishers
- Fish types and sizes can be set, which will set:
    - Default attribute values
    - Hit location & column rolls
- Attack rolls (Close, Far, Mental) will check for a targeted token and, if found, automatically roll against the target's Evade/Willpower and will roll hit location if the attack hits
- Simple styling for character sheets and rolls
- Ballast calculation and initiative roll

## Version 0.2

- Complete overhaul of actor sheets
- Upload the official .fsh data file to access frames/size categories and internals for both fish and fishers
- Utility functions for scanning and weight calculations
- Roll intercept dialog to view applied modifiers, and adjust modifiers/die count before rolling

## Version 0.2.1

User testing performed on this patch!

- Updated internal import to accommodate new .fsh format for action text & attacks
- Tweaks to chat message display of attacks
- Fix update process for new item import process
- Attributes properly cap on actor sheet

## Version 0.2.2

- Add pointer & loading feedback for fsh import
- Bug fixes
- Improved internal message layout

## Version 0.2.3

- Fix bugs around custom bonuses in roll dialog & sheet
- Expandable rolls in chat messages

## Version 0.2.4

- Fix a bug where character sheet buttons would not activate with multiple sheets open

## Version 0.2.5

- Add support for Gearwright July 12 datafiles

## Version 0.3.5

- Add interactive grid tools to actor sheets and HUD
- Add import functionality for actor saves from Gearwright
- Improvements to datafile update process
- Bugfix: AP costs not importing correctly

## Version 0.3.6

- Add a setting to configure the location of the grid HUD (Game Settings -> Configure Settings -> Fathomless Gears)
- Fix a bug where removing the value in the custom attribute modifier box would cause an error when rolling the attribute
- Fix a bug where custom weight additions were ignored by the weight calculator

## Version 0.3.7

- Add Status Icon Counters as a dependency
- Add Stalwart icon
- Attribute-only conditions modify attributes (up to cap of 3)

## Version 0.4.0

- Redesigned roll dialog with toggles for all attribute/roll modifiers
- Blind and Focused are detected by the roll dialog
- Chat messages with attribute rolls show the modifiers applied

## Version 0.4.1

- Fixed Focus and Custom Mod showing up as roll tags when they weren't active
- Grid HUD for fish shows remaining HP
- Grid HUD location defaults to top right
- Added a setting to turn off the grid HUD appearing on hover

## Version 0.5.0

- Added item imports for backgrounds, developments, maneuvers, & deep words
- Fisher imports will detect & import premade and custom backgrounds, developments, maneuvers & deep words
- New layout for fisher sheets

## Version 0.5.1

- Fixed import buttons for fresh characters
- Renamed sheet tabs for fisher sheet
- Relocated import button for fish

## Version 0.5.5

- Added deep words for Ascended Form fish
- Fix background creation (it will not create a new background item in the game's items tab on fisher import)
- Fix a bug where power stat could not be rolled
- Fix a bug where conditions were not being fully removed
- Fix a bug where native Foundry CSS was overridden by system styles
- Fix a bug where deep words were not found on actor import
- Fix a bug where players could view fish grids without scanning via the grid HUD

## Version 0.6.3

- Fish templates will import from Gearwright saves
- Fish sizes (and Jolly Roger) tokens will automatically resize the actor's default token
- Added a macro to bulk generate ballast tokens (size 1 tokens with the ballast value shown as a marker, sutable for the ballast chart)
- Added a display of attributes to the grid HUD
- Enriched the Remaining HP display for fish on the grid HUD (it will now also count tranq and catch counters)
