import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthService } from './GoogleAuthService';

export interface CalendarEvent {
    id: string;
    title: string;
    start: string; // ISO string
    end: string;   // ISO string
    description?: string;
    isGoogleEvent: boolean;
}

export class GoogleCalendarService {
    private authService: GoogleAuthService;
    private calendar: calendar_v3.Calendar;

    constructor(authService: GoogleAuthService) {
        this.authService = authService;
        this.calendar = google.calendar({ version: 'v3', auth: authService.getAuthClient() });
    }

    public async listEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
        if (!this.authService.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items || [];

            return events.map(event => ({
                id: event.id || '',
                title: event.summary || 'No Title',
                start: event.start?.dateTime || event.start?.date || '',
                end: event.end?.dateTime || event.end?.date || '',
                description: event.description || '',
                isGoogleEvent: true
            })).filter(e => e.id && e.start); // Filter out invalid events

        } catch (error: any) {
            console.error('Error fetching calendar events:', error);
            // Auto-handle token refresh errors if needed, though google-auth-library usually handles it
            if (error.code === 401) {
                throw new Error('Authentication expired. Please sign in again.');
            }
            throw error;
        }
    }

    public async insertEvent(event: { title: string, start: string, end: string, description?: string }): Promise<string> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        const resource: calendar_v3.Schema$Event = {
            summary: event.title,
            description: event.description,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
        };

        const response = await this.calendar.events.insert({
            calendarId: 'primary',
            requestBody: resource,
        });

        return response.data.id || '';
    }

    public async updateEvent(eventId: string, event: { title: string, start: string, end: string, description?: string }): Promise<boolean> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        const resource: calendar_v3.Schema$Event = {
            summary: event.title,
            description: event.description,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
        };

        await this.calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: resource,
        });

        return true;
    }

    public async deleteEvent(eventId: string): Promise<boolean> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        await this.calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        return true;
    }
}
