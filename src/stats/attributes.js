// @flow

type Attribute = {
    full: string,
    abbrev: string
};

export const Attributes: { [AttributeType]: Attribute } = {
	"body": {
        full: "Body",
        abbrev: "BOD",
    },
	"agility": {
        full: "Agility",
        abbrev: "AGI",
    },
	"reaction": {
        full: "Reaction",
        abbrev: "REA"
    },
	"strength": {
        full: "Strength",
        abbrev: "STR",
    },
	"willpower": {
        full: "Willpower",
        abbrev: "WILL",
    },
	"logic": {
        full: "Logic",
        abbrev: "LOG",
    },
	"intuition": {
        full: "Intuition",
        abbrev: "INT",
    },
    "charisma": {
        full: "Charisma",
        abbrev: "CHA",
    },
};

export type AttributeType = $Keys<typeof Attributes>;
