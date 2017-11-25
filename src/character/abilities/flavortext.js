// @flow

const MATRIX_SEARCH_PROGRAM_EFFECT: FixedSkillModifier = {
    type: "ability",
    filter: {
        type: "by-id",
        abilityId: "matrix-search"
    },
    dicePoolMod: {
        type: "fixed",
        modifier: +2,
    },
};

// Lost of flavortext!

const RANGED_WEAPON_FLAVORTEXT = {
    good: [
        "Bang bang",
        "Pew pew pew",
        "Say hello to my little friend",
        "Shoot first, ask questions later",
        "Guess the drek's hit the fan",
    ],
    bad: [
        "Shoot some chummers",
        "I think this might hurt",
        "Unload the slugs",
        "Snipe some dudes",
        "Maybe try shooting the side of a barn instead",
    ]
}

const VISUAL_PERCEPTION_FLAVORTEXT = [
    "Analyze your surroundings",
    "Don't miss it, chummer",
    "You still won't see them coming",

    "Look around",
    "Take a good, hard look",
    "Did I see something?",
    "Is that one of Torquebjork's drones?",

    "See through the dragon's eyes",
    "You'll get them in your sights",
];

const AUDIO_PERCEPTION_FLAVORTEXT = {
    good: [
        "Analyze your surroundings",
        "Did I hear something?",
        "Is that the sound of gunshots?",
    ],
    bad: [
        "Listen closely",
        "You still won't hear them coming",
        "Don't miss it, chummer",
    ]
};

const MATRIX_PERCEPTION_FLAVORTEXT = {
    good: [
        "Analyze your virtual surroundings",
        "Look around",
        "Take a good, hard look",
        "ping the local network",
        "Surely _someone's_ running silent",
        "Is there something out there?",
    ],
    bad: [
        "Don't miss it, chummer",
        "Did I see something?",
        "You still won't see them coming",
        "I wonder who's running silent around here?",
        "Does that drone have a machine gun?",
    ]
};

const STEALTH_FLAVORTEXT = {
    good: [
        "They'll never see it coming",
        "They'll never know what hit them",
        "Where'd you go?",
        "Sneakier than a dragon snack",
        "Now you see me...",
    ],
    bad: [
        "I don't think you can hide behind a comlink",
        "No one can hide from my sight",
        "No one can hide from the huntress",
        "They'll totally see you, chummer",
        "You have the stealthiness of a Doberman drone",
        "You stand out like T-bird in the barrens",
        "HERE I AM!!!",
    ]
}
