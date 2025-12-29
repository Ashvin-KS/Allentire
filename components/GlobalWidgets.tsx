import React from 'react';
import { MusicEngine } from './zen/MusicEngine';
import { DynamicIsland } from './DynamicIsland';

/**
 * GlobalWidgets now simply renders the headless MusicEngine
 * and the unified DynamicIsland component.
 */
export const GlobalWidgets: React.FC = () => {
    return (
        <>
            <DynamicIsland />
            <MusicEngine />
        </>
    );
};
