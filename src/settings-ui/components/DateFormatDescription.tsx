interface DateFormatDescriptionProps {
  dateFormat: string;
}

export function DateFormatDescription(props: DateFormatDescriptionProps) {
  return (
    <>
      <a href="https://momentjs.com/docs/#/displaying/format/" target="_blank">
        Format reference.
      </a>{" "}
      Current syntax: <b>{window.moment().format(props.dateFormat)}</b>
    </>
  );
}
