import React from 'react';
import { NotesApp } from '../components/notes/NotesApp';

export const NotesView: React.FC = () => {
    return (
        <div style={{ height: '100%', overflow: 'hidden' }}>
            <NotesApp />
        </div>
    );
};
