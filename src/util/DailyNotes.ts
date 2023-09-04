import { Moment } from "moment/moment";
import {
    createDailyNote,
    getAllDailyNotes,
    getDailyNote,
} from "obsidian-daily-notes-interface";

export async function getDailyNotePath() {
    // TODO: change this
    // TODO: write tests, mock daily-notes-interface
    // TODO: where does the type conflict come from?

    const now = window.moment() as Moment;
    let dailyNote = getDailyNote(now, getAllDailyNotes());

    if (!dailyNote) {
        dailyNote = await createDailyNote(now);
    }

    return dailyNote.path;
}
