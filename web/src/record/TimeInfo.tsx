
import { Small } from "component/Text";

import * as Event from "event";
import * as HumanTime from "component/HumanTime";

type Props = {
    event: Event.Event;
};
export default function TimeInfo({ event }: Props) {
    return (
        <Small>
            <HumanTime.Since date={new Date(event.id)} />
            {("edit" in event) && event.edit && <>
                &nbsp;(edited <HumanTime.Since date={new Date(event.edit!)} />)
            </>
            }
        </Small>
    );
}
