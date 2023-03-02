import { Show, createSignal } from "solid-js";

import { DateFormatDescription } from "./DateFormatDescription";
import { DropDownSetting } from "./DropDownSetting";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { TextAreaSetting } from "./TextAreaSetting";
import { TextSetting } from "./TextSetting";
import { ToggleSetting } from "./ToggleSetting";

import ObsidianTaskArchiver from "../../ObsidianTaskArchiverPlugin";
import { Settings, TaskSortOrder } from "../../Settings";
import { PlaceholderResolver } from "../../features/PlaceholderResolver";

function validatePattern(pattern: string) {
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}

interface ArchiverSettingsProps {
  settings: Settings;
  plugin: ObsidianTaskArchiver;
  placeholderResolver: PlaceholderResolver;
}

export function ArchiverSettings(props: ArchiverSettingsProps) {
  const [archiveAllTypes, setArchiveAllTypes] = createSignal(
    props.settings.archiveAllCheckedTaskTypes
  );
  const [useTaskPattern, setUseTaskPattern] = createSignal(
    props.settings.useAdditionalTaskPattern
  );
  const [taskPattern, setTaskPattern] = createSignal(
    props.settings.additionalTaskPattern
  );
  const [taskPatternTest, setTaskPatternTest] = createSignal("Water the cat #task");
  const [applyReplacement, setApplyReplacement] = createSignal(
    props.settings.textReplacement.applyReplacement
  );
  const [replacement, setReplacement] = createSignal(
    props.settings.textReplacement.replacement
  );
  const [regex, setRegex] = createSignal(props.settings.textReplacement.regex);
  const [replacementTest, setReplacementTest] = createSignal(
    props.settings.textReplacement.replacementTest
  );
  const [archiveToSeparateFile, setArchiveToSeparateFile] = createSignal(
    props.settings.archiveToSeparateFile
  );
  const [defaultArchiveFileName, setDefaultArchiveFileName] = createSignal(
    props.settings.defaultArchiveFileName
  );
  const [dateFormat, setDateFormat] = createSignal(props.settings.dateFormat);
  const [archiveHeading, setArchiveHeading] = createSignal(
    props.settings.archiveHeading
  );
  const [addNewlines, setAddNewlines] = createSignal(
    props.settings.addNewlinesAroundHeadings
  );
  const [headingDepth, setHeadingDepth] = createSignal(
    props.settings.archiveHeadingDepth
  );

  const [useWeeks, setUseWeeks] = createSignal(props.settings.useWeeks);
  const [weeklyNoteFormat, setWeeklyNoteFormat] = createSignal(
    props.settings.weeklyNoteFormat
  );

  const [useDays, setUseDays] = createSignal(props.settings.useDays);
  const [dailyNoteFormat, setDailyNoteFormat] = createSignal(
    props.settings.dailyNoteFormat
  );

  const [addMetadata, setAddMetadata] = createSignal(
    props.settings.additionalMetadataBeforeArchiving.addMetadata
  );
  const [metadata, setMetadata] = createSignal(
    props.settings.additionalMetadataBeforeArchiving.metadata
  );
  const [metadataDateFormat, setMetadataDateFormat] = createSignal(
    props.settings.additionalMetadataBeforeArchiving.dateFormat
  );
  const [sortOrder, setSortOrder] = createSignal(props.settings.taskSortOrder);

  const getValidationMessage = () => {
    if (!validatePattern(taskPattern())) {
      return `🕱 Invalid pattern`;
    }

    if (taskPatternTest().trim().length === 0) {
      return "Empty";
    }

    const match = new RegExp(taskPattern()).test(taskPatternTest());
    if (match) {
      return "✔️ Will be archived";
    }

    return "❌ Won't be archived";
  };

  const getReplacementResult = () =>
    replacementTest().replace(new RegExp(regex()), replacement());

  return (
    <>
      <h1>Archiver Settings</h1>
      <TextSetting
        onInput={async ({ currentTarget: { value } }) => {
          setArchiveHeading(value);
          props.plugin.settings.archiveHeading = value;
          await props.plugin.saveSettings();
        }}
        name="Archive heading text"
        description="A heading with this text will be used as an archive"
        value={archiveHeading()}
      />
      <DropDownSetting
        onInput={async ({ currentTarget: { value } }) => {
          const valueAsNumber = Number(value);
          setHeadingDepth(valueAsNumber);
          props.plugin.settings.archiveHeadingDepth = valueAsNumber;
          await props.plugin.saveSettings();
        }}
        name="Depth of new archive headings"
        options={["1", "2", "3", "4", "5", "6"]}
        value={String(headingDepth())}
      />
      <DropDownSetting
        onInput={async ({ currentTarget: { value } }) => {
          // todo: handle this without an assertion?
          const asserted = value as TaskSortOrder;
          setSortOrder(asserted);
          props.settings.taskSortOrder = asserted;
          await props.plugin.saveSettings();
        }}
        name={"Order archived tasks"}
        options={[TaskSortOrder.NEWEST_LAST, TaskSortOrder.NEWEST_FIRST]}
        value={sortOrder()}
      />
      <ToggleSetting
        onClick={async () => {
          const inverse = !addNewlines();
          setAddNewlines(inverse);
          props.plugin.settings.addNewlinesAroundHeadings = inverse;
          await props.plugin.saveSettings();
        }}
        name="Add newlines around the archive heading"
        value={addNewlines()}
      />
      <ToggleSetting
        name="Archive all checked tasks"
        description="Archive tasks with symbols other than 'x' (like '[>]', '[-]', etc.)"
        value={archiveAllTypes()}
        onClick={async () => {
          const inverse = !archiveAllTypes();
          setArchiveAllTypes(inverse);
          props.settings.archiveAllCheckedTaskTypes = inverse;
          await props.plugin.saveSettings();
        }}
      />
      <ToggleSetting
        name="Use additional task filter"
        description="Only archive tasks matching this pattern, typically '#task' but can be anything."
        onClick={async () => {
          const inverse = !useTaskPattern();
          setUseTaskPattern(inverse);
          props.settings.useAdditionalTaskPattern = inverse;
          await props.plugin.saveSettings();
        }}
        value={useTaskPattern()}
      />
      <Show when={useTaskPattern()} keyed>
        <TextSetting
          name="Additional task filter"
          onInput={async ({ currentTarget: { value } }) => {
            setTaskPattern(value);
            if (validatePattern(value)) {
              props.plugin.settings.additionalTaskPattern = value;
              await props.plugin.saveSettings();
            }
          }}
          description={
            validatePattern(taskPattern())
              ? "The pattern is valid"
              : `🕱 Invalid pattern`
          }
          value={taskPattern()}
          class="archiver-setting-sub-item"
        />
        <TextAreaSetting
          name="Try out your task filter"
          description={getValidationMessage()}
          onInput={({ currentTarget: { value } }) => {
            setTaskPatternTest(value);
          }}
          value={taskPatternTest()}
          class="archiver-setting-sub-item"
        />
      </Show>
      <ToggleSetting
        name="Replace some text before archiving"
        description="You can use it to remove tags from your archived tasks. Note that this replacement is applied to all the list items in the completed task"
        onClick={async () => {
          const inverse = !applyReplacement();
          setApplyReplacement(inverse);
          props.settings.textReplacement.applyReplacement = inverse;
          await props.plugin.saveSettings();
        }}
        value={applyReplacement()}
      />
      <Show when={applyReplacement()} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setRegex(value);
            props.plugin.settings.textReplacement.regex = value;
            await props.plugin.saveSettings();
          }}
          name={"Regular expression"}
          value={regex()}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setReplacement(value);
            props.plugin.settings.textReplacement.replacement = value;
            await props.plugin.saveSettings();
          }}
          name="Replacement"
          value={replacement()}
          class="archiver-setting-sub-item"
        />
        <TextAreaSetting
          name="Try out your replacement"
          description={
            <>
              Replacement result: <b>{getReplacementResult()}</b>
            </>
          }
          onInput={async ({ currentTarget: { value } }) => {
            setReplacementTest(value);
            props.plugin.settings.textReplacement.replacementTest = value;
            await props.plugin.saveSettings();
          }}
          value={replacementTest()}
          class="archiver-setting-sub-item"
        />
      </Show>
      <ToggleSetting
        name="Archive to a separate file"
        description="If checked, the archiver will search for a file based on the pattern and will try to create it if needed"
        onClick={async () => {
          const inverse = !archiveToSeparateFile();
          setArchiveToSeparateFile(inverse);
          props.settings.archiveToSeparateFile = inverse;
          await props.plugin.saveSettings();
        }}
        value={archiveToSeparateFile()}
      />
      <Show when={archiveToSeparateFile()} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setDefaultArchiveFileName(value);
            props.settings.defaultArchiveFileName = value;
            await props.plugin.saveSettings();
          }}
          name="Archive file name"
          description={
            <PlaceholdersDescription placeholderResolver={props.placeholderResolver} />
          }
          value={defaultArchiveFileName()}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setDateFormat(value);
            props.plugin.settings.dateFormat = value;
            await props.plugin.saveSettings();
          }}
          name={
            <>
              <code>{"{{date}}"}</code> format
            </>
          }
          description={<DateFormatDescription dateFormat={dateFormat()} />}
          value={dateFormat()}
          class="archiver-setting-sub-item"
        />
      </Show>

      <ToggleSetting
        onClick={async () => {
          const inverse = !addMetadata();
          setAddMetadata(inverse);
          props.settings.additionalMetadataBeforeArchiving.addMetadata = inverse;
          await props.plugin.saveSettings();
        }}
        name={"Append some metadata to task before archiving"}
        value={addMetadata()}
      />
      <Show when={addMetadata()} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setMetadata(value);
            props.settings.additionalMetadataBeforeArchiving.metadata = value;
            await props.plugin.saveSettings();
          }}
          name="Metadata to append"
          description={
            <>
              <PlaceholdersDescription
                placeholderResolver={props.placeholderResolver}
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
                {props.placeholderResolver.resolvePlaceholders(
                  metadata(),
                  metadataDateFormat()
                )}
              </code>
            </>
          }
          value={metadata()}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setMetadataDateFormat(value);
            props.settings.additionalMetadataBeforeArchiving.dateFormat = value;
            await props.plugin.saveSettings();
          }}
          name="Date format"
          description={<DateFormatDescription dateFormat={metadataDateFormat()} />}
          value={metadataDateFormat()}
          class="archiver-setting-sub-item"
        />
      </Show>

      <h2>Date tree settings</h2>

      <ToggleSetting
        onClick={async () => {
          const inverse = !useWeeks();
          setUseWeeks(inverse);
          props.plugin.settings.useWeeks = inverse;
          await props.plugin.saveSettings();
        }}
        name="Use weeks"
        description="Add completed tasks under a link to the current week"
        value={useWeeks()}
      />
      <Show when={useWeeks()} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setWeeklyNoteFormat(value);
            props.settings.weeklyNoteFormat = value;
            await props.plugin.saveSettings();
          }}
          name="Weekly note pattern"
          description={<DateFormatDescription dateFormat={weeklyNoteFormat()} />}
          value={weeklyNoteFormat()}
          class="archiver-setting-sub-item"
        />
      </Show>
      <ToggleSetting
        onClick={async () => {
          const inverse = !useDays();
          setUseDays(inverse);
          props.plugin.settings.useDays = inverse;
          await props.plugin.saveSettings();
        }}
        name="Use days"
        description="Add completed tasks under a link to the current day"
        value={useDays()}
      />
      <Show when={useDays()} keyed>
        <TextSetting
          onInput={async ({ currentTarget: { value } }) => {
            setDailyNoteFormat(value);
            props.settings.dailyNoteFormat = value;
            await props.plugin.saveSettings();
          }}
          name="Daily note pattern"
          description={<DateFormatDescription dateFormat={dailyNoteFormat()} />}
          value={dailyNoteFormat()}
          class="archiver-setting-sub-item"
        />
      </Show>
    </>
  );
}
