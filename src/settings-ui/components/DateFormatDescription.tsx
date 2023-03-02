interface DateFormatDescriptionProps {
  dateFormat: string;
}

export function DateFormatDescription(props: DateFormatDescriptionProps) {
  return (
    <>
      For more syntax, refer to{" "}
      <a href="https://momentjs.com/docs/#/displaying/format/" target="_blank">
        format reference
      </a>
      <br />
      Your current syntax looks like this:{" "}
      <b>{window.moment().format(props.dateFormat)}</b>
    </>
  );
}
