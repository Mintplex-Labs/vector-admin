import moment from 'moment';

export function databaseTimestampFromNow(timeDateString: string) {
  if (!timeDateString)
    return moment.unix(Math.floor(Number(new Date()) / 1000) - 30).fromNow();
  const utcString = moment.utc(timeDateString).format('YYYY-MM-DDTHH:mm:ss');
  return moment(utcString).fromNow();
}
