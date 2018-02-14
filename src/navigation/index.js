// @react

export type PageInfo = {
    disabled: boolean
};

export const ALL_PAGES: { [Page]: PageInfo } = {
    "combat": { disabled: true },
    "skills": { disabled: false },
    "attributes": { disabled: false },
    "gear": { disabled: true },
    "edit": { disabled: false },
    "import": { disabled: false },
    "export": { disabled: true }
}

export type Page = $Keys<ALL_PAGES>;
