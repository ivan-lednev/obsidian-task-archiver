import { For, Index, Show } from "solid-js";

import { DateFormatDescription } from "./DateFormatDescription";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { Rule } from "./Rule";
import { TaskPatternSettings } from "./TaskPatternSettings";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { DropDownSetting } from "./setting/DropDownSetting";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";
import { ToggleSetting } from "./setting/ToggleSetting";

import { DEFAULT_DATE_FORMAT } from "../../Constants";
import { Settings, TaskSortOrder } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface ArchiverSettingsPageProps {
  placeholderService: PlaceholderService;
}

export function ArchiverSettingsPage(props: ArchiverSettingsPageProps) {
  const [settings, setSettings] = useSettingsContext();

  const getReplacementResult = () =>
    settings.textReplacement.replacementTest.replace(
      new RegExp(settings.textReplacement.regex),
      settings.textReplacement.replacement
    );

  return (
    <>
      <h1>Archiver Settings</h1>
      <DropDownSetting
        onInput={async ({ currentTarget: { value } }) => {
          // todo: handle this without an assertion?
          const asserted = value as TaskSortOrder;
          setSettings("taskSortOrder", asserted);
        }}
        name={"Order archived tasks"}
        options={[TaskSortOrder.NEWEST_LAST, TaskSortOrder.NEWEST_FIRST]}
        value={settings.taskSortOrder}
      />
      <ToggleSetting
        onClick={() => setSettings("sortAlphabetically", (prev) => !prev)}
        name="Sort top-level tasks alphabetically before archiving"
        value={settings.sortAlphabetically}
      />
      <TextSetting
        onInput={({ currentTarget: { value } }) => {
          setSettings({ archiveHeading: value });
        }}
        name="Archive heading text"
        description="A heading with this text will be used as an archive"
        value={settings.archiveHeading}
      />
      <ToggleSetting
        onClick={() => {
          setSettings("addNewlinesAroundHeadings", (prev) => !prev);
        }}
        name="Add newlines around the archive heading"
        value={settings.addNewlinesAroundHeadings}
      />
      <ToggleSetting
        name="Archive all checked tasks"
        description="Archive tasks with symbols other than 'x' (like '[>]', '[-]', etc.)"
        value={settings.archiveAllCheckedTaskTypes}
        onClick={() =>
          setSettings({
            archiveAllCheckedTaskTypes: !settings.archiveAllCheckedTaskTypes,
          })
        }
      />
      <TaskPatternSettings />
      <ToggleSetting
        name="Replace some text before archiving"
        description="You can use it to remove tags from your archived tasks. Note that this replacement is applied to all the list items in the completed task"
        onClick={() => {
          setSettings("textReplacement", "applyReplacement", (prev) => !prev);
        }}
        value={settings.textReplacement.applyReplacement}
      />
      <Show when={settings.textReplacement.applyReplacement} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setSettings("textReplacement", "regex", value);
          }}
          name={"Regular expression"}
          value={settings.textReplacement.regex}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setSettings("textReplacement", "replacement", value);
          }}
          name="Replacement"
          value={settings.textReplacement.replacement}
          class="archiver-setting-sub-item"
        />
        <TextAreaSetting
          name="Try out your replacement"
          description={
            <>
              Replacement result: <b>{getReplacementResult()}</b>
            </>
          }
          onInput={({ currentTarget: { value } }) => {
            setSettings("textReplacement", "replacementTest", value);
          }}
          value={settings.textReplacement.replacementTest}
          class="archiver-setting-sub-item"
        />
      </Show>
      <ToggleSetting
        name="Archive to a separate file"
        description="If checked, the archiver will search for a file based on the pattern and will try to create it if needed"
        onClick={() => {
          setSettings({ archiveToSeparateFile: !settings.archiveToSeparateFile });
        }}
        value={settings.archiveToSeparateFile}
      />
      <Show when={settings.archiveToSeparateFile} keyed>
        <TextAreaSetting
          onInput={async ({ currentTarget: { value } }) => {
            setSettings({ defaultArchiveFileName: value });
          }}
          name="File name"
          description={
            <PlaceholdersDescription placeholderResolver={props.placeholderService} />
          }
          value={settings.defaultArchiveFileName}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings({ dateFormat: value });
          }}
          name={
            <>
              <code>{"{{date}}"}</code> format
            </>
          }
          description={<DateFormatDescription dateFormat={settings.dateFormat} />}
          value={settings.dateFormat}
          class="archiver-setting-sub-item"
        />
      </Show>

      <ToggleSetting
        onClick={() => {
          setSettings("archiveUnderHeading", (prev) => !prev);
        }}
        name="Archive under headings"
        description="When disabled, no headings will get created"
        value={settings.archiveUnderHeading}
      />
      <Show when={settings.archiveUnderHeading} keyed>
        <DropDownSetting
          onInput={async ({ currentTarget: { value } }) => {
            setSettings({ archiveHeadingDepth: Number(value) });
          }}
          name="Start depth"
          options={["1", "2", "3", "4", "5", "6"]}
          value={String(settings.archiveHeadingDepth)}
          class="archiver-setting-sub-item"
        />
        <For each={settings.headings}>
          {(heading, index) => {
            // indeed, we need this!
            const headingLevel = () => index() + 1;
            return (
              <>
                <BaseSetting
                  name={`Heading text (level ${headingLevel()})`}
                  class="archiver-setting-sub-item"
                >
                  <input
                    type="text"
                    value={heading.text}
                    onInput={({ currentTarget: { value } }) =>
                      setSettings("headings", index(), { text: value })
                    }
                  />
                  <button
                    onClick={() =>
                      setSettings("headings", (prev) =>
                        prev.filter((h, i) => i !== index())
                      )
                    }
                  >
                    Delete
                  </button>
                </BaseSetting>
                <TextSetting
                  onInput={async ({ currentTarget: { value } }) => {
                    setSettings("headings", index(), { dateFormat: value });
                  }}
                  name={`Date format (level ${headingLevel()})`}
                  placeholder={DEFAULT_DATE_FORMAT}
                  description={
                    <DateFormatDescription
                      dateFormat={heading.dateFormat || DEFAULT_DATE_FORMAT}
                    />
                  }
                  value={heading.dateFormat}
                  class="archiver-setting-sub-item"
                />
              </>
            );
          }}
        </For>

        <BaseSetting class="archiver-setting-sub-item">
          <button
            onClick={() =>
              setSettings("headings", (prev) => [...prev, { text: "", dateFormat: "" }])
            }
          >
            Add heading
          </button>
        </BaseSetting>

        <BaseSetting
          name="Here's what the result looks like:"
          class="archiver-setting-sub-item"
          description={
            <>
              {settings.headings.map((heading, i) => {
                // todo: why does it work without a signal?
                const token = "#".repeat(i + settings.archiveHeadingDepth);
                return (
                  <>
                    <code>
                      {token}{" "}
                      {props.placeholderService.resolve(
                        heading.text,
                        heading.dateFormat || DEFAULT_DATE_FORMAT
                      )}
                    </code>
                    <br />
                  </>
                );
              })}
              <p>
                <code>- [x] task</code>
              </p>
            </>
          }
        />
      </Show>

      <ToggleSetting
        onClick={async () => {
          setSettings(
            "additionalMetadataBeforeArchiving",
            "addMetadata",
            (prev) => !prev
          );
        }}
        name={"Append some metadata to task before archiving"}
        value={settings.additionalMetadataBeforeArchiving.addMetadata}
      />
      <Show when={settings.additionalMetadataBeforeArchiving.addMetadata} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setSettings("additionalMetadataBeforeArchiving", "metadata", value);
          }}
          name="Metadata to append"
          description={
            <>
              <PlaceholdersDescription
                placeholderResolver={props.placeholderService}
                extraPlaceholders={[
                  [
                    "{{heading}}",
                    "resolves to the closest heading above the task; when there are none, defaults to file name",
                  ],
                ]}
              />
              <br />
              Current result:{" "}
              <code>
                - [x] water the cat #task{" "}
                {props.placeholderService.resolve(
                  settings.additionalMetadataBeforeArchiving.metadata,
                  settings.additionalMetadataBeforeArchiving.dateFormat
                )}
              </code>
            </>
          }
          value={settings.additionalMetadataBeforeArchiving.metadata}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setSettings("additionalMetadataBeforeArchiving", "dateFormat", value);
          }}
          name="Date format"
          description={
            <DateFormatDescription
              dateFormat={settings.additionalMetadataBeforeArchiving.dateFormat}
            />
          }
          value={settings.additionalMetadataBeforeArchiving.dateFormat}
          class="archiver-setting-sub-item"
        />
      </Show>

      <h2>Date tree settings</h2>

      <ToggleSetting
        onClick={async () => {
          setSettings("useWeeks", (prev) => !prev);
        }}
        name="Use weeks"
        description="Add completed tasks under a link to the current week"
        value={settings.useWeeks}
      />
      <Show when={settings.useWeeks} keyed>
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings({ weeklyNoteFormat: value });
          }}
          name="Weekly note pattern"
          description={<DateFormatDescription dateFormat={settings.weeklyNoteFormat} />}
          value={settings.weeklyNoteFormat}
          class="archiver-setting-sub-item"
        />
      </Show>
      <ToggleSetting
        onClick={() => {
          setSettings("useDays", (prev) => !prev);
        }}
        name="Use days"
        description="Add completed tasks under a link to the current day"
        value={settings.useDays}
      />
      <Show when={settings.useDays} keyed>
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings({ dailyNoteFormat: value });
          }}
          name="Daily note pattern"
          description={<DateFormatDescription dateFormat={settings.dailyNoteFormat} />}
          value={settings.dailyNoteFormat}
          class="archiver-setting-sub-item"
        />
      </Show>
      <h2>Rules</h2>
      <BaseSetting description="Define rules for handling tasks that match certain conditions">
        <button
          onClick={() =>
            setSettings("rules", (prev) => [
              ...prev,
              // todo: same as getDefaultRule()
              {
                statuses: "",
                defaultArchiveFileName: "",
                dateFormat: DEFAULT_DATE_FORMAT,
                archiveToSeparateFile: true,
              },
            ])
          }
        >
          Add rule
        </button>
      </BaseSetting>
      <For each={settings.rules}>
        {(rule, index) => (
          <Rule index={index} placeholderResolver={props.placeholderService} />
        )}
      </For>
    </>
  );
}
