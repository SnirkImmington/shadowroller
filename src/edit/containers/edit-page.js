// @flow

import './edit-page.css';

import * as React from 'react';

import { EditSkills, EditAttributes } from '../components';

type Props = {

};

export default function EditPage(props: Props) {
    return (
        <div id="edit-page">
            <EditSkills />
            <EditAttributes />
        </div>
    )
}
