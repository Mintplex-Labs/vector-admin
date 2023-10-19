import moment from 'moment';

export function databaseTimestampFromNow(timeDateString: string) {
  if (!timeDateString)
    return moment.unix(Math.floor(Number(new Date()) / 1000) - 30).fromNow();
  return moment(timeDateString, moment.ISO_8601).fromNow();
}
