import { render, screen } from "@solidjs/testing-library";
import user from "@testing-library/user-event";

import { DEFAULT_DATE_FORMAT } from "../../../Constants";
import {
  ArchiveFileType,
  DEFAULT_SETTINGS_FOR_TESTS,
  RuleAction,
} from "../../../Settings";
import { PlaceholderService } from "../../../services/PlaceholderService";
import { ArchiverSettingsPage } from "../ArchiverSettingsPage";
import { SettingsProvider } from "../context/SettingsProvider";

// todo: generalize mocks here
function renderSettingsPage() {
  const mockWorkspace = {
    getActiveFile() {
      return {
        path: "path/to/file.md",
        basename: "file",
      };
    },
  };

  const placeholderService = new PlaceholderService(mockWorkspace);

  const setSettingsMock = jest.fn();

  render(() => (
    <SettingsProvider
      initialSettings={{ ...DEFAULT_SETTINGS_FOR_TESTS }} // todo: looks like solid mutates this
      setSettings={setSettingsMock}
    >
      <ArchiverSettingsPage placeholderService={placeholderService} />
    </SettingsProvider>
  ));

  return { setSettingsMock };
}

describe("ArchiverSettingsPage", () => {
  test("Default rules get saved", async () => {
    const { setSettingsMock } = renderSettingsPage();

    await user.click(screen.getByText("Add rule"));

    expect(setSettingsMock).toBeCalledWith(
      expect.objectContaining({
        rules: [
          {
            pathPatterns: "",
            statuses: "",
            defaultArchiveFileName: "",
            dateFormat: DEFAULT_DATE_FORMAT,
            obsidianTasksCompletedDateFormat: DEFAULT_DATE_FORMAT,
            ruleAction: RuleAction.MOVE_TO_FILE,
            archiveToSeparateFile: true,
            separateFileType: ArchiveFileType.CUSTOM,
          },
        ],
      })
    );
  });

  test("Add and delete a rule", async () => {
    renderSettingsPage();

    const addRule = screen.getByText("Add rule");

    await user.click(addRule);

    expect(screen.getByText("Delete rule")).toBeEnabled();

    await user.click(screen.getByText("Delete rule"));

    expect(screen.queryByText("Delete rule")).not.toBeInTheDocument();
  });
});
