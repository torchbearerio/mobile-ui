export const INSTRUCTION_DISTANCES = {
    "1320": "In a quarter mile, ",
    "100": "In one-hundred feet, ",
    "50": "",
};

//export const ROUTEMANAGER_HOSTNAME = 'http://localhost:41011';
export const ROUTEMANAGER_HOSTNAME = 'http://routemanager.torchbearer.io';

// If these look funky, that's because the key refers to the position of landmark relative to intersection.
// Thus, we have to "flip it" if we're telling someone when to actually turn.
export const LANDMARK_POSITIONS = {
    at: "at",
    just_before: "just after",
    before: "after"
};