import * as React from "react";

import * as Text from "component/Text";

type Props = {
    messages: string[],
    changes: number;
};

/** Displays a small message to the user about how */
export default function FormStatus({ messages, changes }: Props) {
    let inner: string;
    if (messages.length === 1) {
        inner = messages[0];
    }
    else if (messages.length > 0) {
        inner = `${messages[0]} +${messages.length - 1}`;
    }
    else if (changes == 1) {
        inner = "1 change";
    }
    else if (changes > 1) {
        inner = `${changes} changes`;
    }
    else {
        inner = `no changes`;
    }

    return (
        <Text.Small>
            ({inner})
        </Text.Small>
    );
}
