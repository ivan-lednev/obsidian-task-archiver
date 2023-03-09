import { fireEvent, render, screen } from "@solidjs/testing-library";

import { DEFAULT_SETTINGS_FOR_TESTS } from "../../../Settings";
import { PlaceholderService } from "../../../services/PlaceholderService";
import { ArchiverSettingsPage } from "../ArchiverSettingsPage";
import { SettingsProvider } from "../context/SettingsProvider";

// function App() {
//     const [store, setStore] = createStore({ count: 0 });
//
//     return (
//         <>
//             <p>Store count: {store.count}</p>
//             <button onClick={() => setStore("count", store.count + 1)}>
//                 Increment
//             </button>
//         </>
//     );
// }

describe("ArchiverSettingsPage", () => {
    // todo: generalize mocks here
    const mockPlugin = {
        settings: DEFAULT_SETTINGS_FOR_TESTS,
        async saveSettings() {
            return jest.fn();
        },
    };

    const mockWorkspace = {
        getActiveFile() {
            return {
                path: "path/to/file.md",
                basename: "file",
            };
        },
    };

    const placeholderService = new PlaceholderService(mockWorkspace);

    test("Add and delete a rule", () => {
        render(() => (
            <SettingsProvider plugin={mockPlugin}>
                <ArchiverSettingsPage placeholderService={placeholderService} />
            </SettingsProvider>
        ));

        const addRule = screen.getByText(/add rule/i);

        fireEvent.click(addRule);

        expect(screen.getByText("Delete rule")).toBeEnabled();

        fireEvent.click(screen.getByText("Delete rule"));

        expect(screen.queryByText("Delete rule")).not.toBeInTheDocument();
    });
});
