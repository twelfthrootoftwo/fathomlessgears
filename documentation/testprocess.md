## Testing

### Local
1. Import latest .fsh, check all expected types (frame, pc/npc internals, size categories) have imported
2. Create PC and NPC
#### Attributes
3. Assign frame to PC, size to NPC, reload, check attributes have saved
4. Assign attribute & resource internals to PC, reload, check attributes have saved
5. Break attribute & resource internals, reload, check attributes have saved & internals are broken
6. Repair internals then rome, reload, check attribtues have saved
#### Interaction
7. Give PC and NPC attacking internals & active internals
8. Place tokens on a scene, make targeted rolls in both directions, check internal attacks print properly & size categories are detected
9. Trigger internals from sheet and HUD
10. Trigger location roll from sheet and HUD
11. Place multiple NPC copies, select all, run weight calc script
### Local (Player)
12. Log in as player, check no access to NPC
13. Scan NPC token, check player now has access to token sheet but can't interact
14. Check breaking NPC internals creates message for player
15. Revoke scan, check player loses access to token sheet
16. Check breaking NPC internals doesn't show message for player
### Online
17. Test performance assigning frame & internals
