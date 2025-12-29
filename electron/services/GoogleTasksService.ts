import { google, tasks_v1 } from 'googleapis';
import { GoogleAuthService } from './GoogleAuthService';

export interface GoogleTask {
    id: string;
    title: string;
    notes?: string;
    due?: string; // RFC 3339 date string
    status: 'needsAction' | 'completed';
    webViewLink?: string;
}

export interface TaskInput {
    title: string;
    notes?: string;
    due?: string; // YYYY-MM-DD or RFC 3339
}

export class GoogleTasksService {
    private authService: GoogleAuthService;
    private tasks: tasks_v1.Tasks;

    constructor(authService: GoogleAuthService) {
        this.authService = authService;
        this.tasks = google.tasks({ version: 'v1', auth: authService.getAuthClient() });
    }

    public async listTaskLists(): Promise<tasks_v1.Schema$TaskList[]> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');
        const response = await this.tasks.tasklists.list();
        return response.data.items || [];
    }

    public async listTasks(tasklistId: string = '@default'): Promise<GoogleTask[]> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        try {
            const response = await this.tasks.tasks.list({
                tasklist: tasklistId,
                showCompleted: true,
                showHidden: true,
            });

            const tasks = response.data.items || [];

            return tasks.map(t => ({
                id: t.id || '',
                title: t.title || 'No Title',
                notes: t.notes || undefined,
                due: t.due || undefined,
                status: t.status as 'needsAction' | 'completed',
                webViewLink: t.webViewLink || undefined
            }));
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    public async insertTask(tasklistId: string = '@default', taskData: TaskInput): Promise<string> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        const requestBody: any = {
            title: taskData.title
        };

        if (taskData.notes) {
            requestBody.notes = taskData.notes;
        }

        if (taskData.due) {
            // Convert YYYY-MM-DD to RFC 3339 if needed
            requestBody.due = taskData.due.includes('T') ? taskData.due : `${taskData.due}T00:00:00.000Z`;
        }

        const response = await this.tasks.tasks.insert({
            tasklist: tasklistId,
            requestBody
        });

        return response.data.id || '';
    }

    public async updateTask(tasklistId: string = '@default', taskId: string, task: { title?: string, notes?: string, due?: string, status?: 'needsAction' | 'completed' }): Promise<boolean> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        const requestBody: any = {};
        if (task.title !== undefined) requestBody.title = task.title;
        if (task.notes !== undefined) requestBody.notes = task.notes;
        if (task.due !== undefined) {
            requestBody.due = task.due.includes('T') ? task.due : `${task.due}T00:00:00.000Z`;
        }
        if (task.status !== undefined) requestBody.status = task.status;

        await this.tasks.tasks.patch({
            tasklist: tasklistId,
            task: taskId,
            requestBody
        });

        return true;
    }

    public async deleteTask(tasklistId: string = '@default', taskId: string): Promise<boolean> {
        if (!this.authService.isAuthenticated()) throw new Error('Not authenticated');

        await this.tasks.tasks.delete({
            tasklist: tasklistId,
            task: taskId
        });

        return true;
    }
}
