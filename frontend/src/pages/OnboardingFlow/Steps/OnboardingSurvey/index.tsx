import { FormEvent, useState } from 'react';
import { COMPLETE_QUESTIONNAIRE } from '../../../../utils/constants';

type OnboardingSurveyProps = {
  setCurrentStep: (step: string) => void;
  setLoading: (loading: boolean) => void;
  stepIdx: number;
  stepCount: number;
};

async function sendQuestionnaire({
  email,
  useCase,
  comment,
}: {
  email: string;
  useCase: string;
  comment?: string | null;
}) {
  if (import.meta.env.DEV) return;
  return fetch(`https://onboarding-wxich7363q-uc.a.run.app`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      useCase,
      comment,
      sourceId: '7DaBbrMSn8zE4eBN++F18BT5zs+BPENi',
    }),
  })
    .then(() => {
      window.localStorage.setItem(COMPLETE_QUESTIONNAIRE, 'true');
      console.log(`✅ Questionnaire responses sent.`);
    })
    .catch((error) => {
      console.error(`sendQuestionnaire`, error.message);
    });
}

export default function OnboardingSurvey({
  setCurrentStep,
  stepIdx,
  stepCount,
}: OnboardingSurveyProps) {
  const [selectedOption, setSelectedOption] = useState('');
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await sendQuestionnaire({
      email: formData.get('email') as string,
      useCase: (formData.get('use_case') || 'other') as string,
      comment: (formData.get('comment') as string) || null,
    });
    setCurrentStep('sync_vector_db');
  };

  function skipSurvey() {
    setCurrentStep('sync_vector_db');
  }

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 0{stepIdx}/
        <span className="text-white text-opacity-40">0{stepCount}</span>
      </div>
      <div className="mb-3 text-2xl font-medium text-white">
        Help us improve VectorAdmin
      </div>
      <div className="w-[300px] text-sm font-light text-white text-opacity-90">
        This optional survey helps us build VectorAdmin with the features you
        need.
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5 mt-7 flex flex-col gap-y-1">
          <label htmlFor="email" className="text-base font-medium text-white">
            What's your email?{' '}
          </label>
          <input
            required={true}
            type="email"
            name="email"
            placeholder="you@gmail.com"
            className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
          />
        </div>

        <div className=" mb-3.5 mt-7">
          <label
            className="text-base font-medium text-white"
            htmlFor="use_case"
          >
            What will you use VectorAdmin for?{' '}
          </label>
          <div className="mt-2 flex flex-col gap-y-3">
            <label
              className={`flex h-11 w-full cursor-pointer items-center justify-start gap-2.5 rounded-lg border border-transparent bg-white/10 p-2.5 transition-all duration-300 ${
                selectedOption === 'business'
                  ? 'border-white border-opacity-40'
                  : ''
              } hover:border-white/60`}
            >
              <input
                type="radio"
                name="use_case"
                value={'business'}
                checked={selectedOption === 'business'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="hidden"
              />
              <div
                className={`mr-2 h-4 w-4 rounded-full border-2 border-white ${
                  selectedOption === 'business' ? 'bg-white' : ''
                }`}
              ></div>
              <div className="font-['Plus Jakarta Sans'] text-sm font-medium leading-tight text-white">
                For my business
              </div>
            </label>
            <label
              className={`flex h-11 w-full cursor-pointer items-center justify-start gap-2.5 rounded-lg border border-transparent bg-white/10 p-2.5 transition-all duration-300 ${
                selectedOption === 'personal'
                  ? 'border-white border-opacity-40'
                  : ''
              } hover:border-white/60`}
            >
              <input
                type="radio"
                name="use_case"
                value={'personal'}
                checked={selectedOption === 'personal'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="hidden"
              />
              <div
                className={`mr-2 h-4 w-4 rounded-full border-2 border-white ${
                  selectedOption === 'personal' ? 'bg-white' : ''
                }`}
              ></div>
              <div className="font-['Plus Jakarta Sans'] text-sm font-medium leading-tight text-white">
                For personal use
              </div>
            </label>
            <label
              className={`flex h-11 w-full cursor-pointer items-center justify-start gap-2.5 rounded-lg border border-transparent bg-white/10 p-2.5 transition-all duration-300 ${
                selectedOption === 'job' ? 'border-white border-opacity-40' : ''
              } hover:border-white/60`}
            >
              <input
                type="radio"
                name="use_case"
                value={'job'}
                checked={selectedOption === 'job'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="hidden"
              />
              <div
                className={`mr-2 h-4 w-4 rounded-full border-2 border-white ${
                  selectedOption === 'job' ? 'bg-white' : ''
                }`}
              ></div>
              <div className="font-['Plus Jakarta Sans'] text-sm font-medium leading-tight text-white">
                For my job
              </div>
            </label>
            <label
              className={`flex h-11 w-full cursor-pointer items-center justify-start gap-2.5 rounded-lg border border-transparent bg-white/10 p-2.5 transition-all duration-300 ${
                selectedOption === 'other'
                  ? 'border-white border-opacity-40'
                  : ''
              } hover:border-white/60`}
            >
              <input
                type="radio"
                name="use_case"
                value={'other'}
                checked={selectedOption === 'other'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="hidden"
              />
              <div
                className={`mr-2 h-4 w-4 rounded-full border-2 border-white ${
                  selectedOption === 'other' ? 'bg-white' : ''
                }`}
              ></div>
              <div className="font-['Plus Jakarta Sans'] text-sm font-medium leading-tight text-white">
                Other
              </div>
            </label>
          </div>
        </div>

        <div className="mb-3.5 mt-7 flex flex-col gap-y-1">
          <label htmlFor="comment" className="text-base font-medium text-white">
            Any comments for the team?{' '}
            <span className="text-base font-light text-neutral-400">
              (Optional)
            </span>
          </label>
          <textarea
            required={true}
            name="comment"
            rows={8}
            wrap="soft"
            autoComplete="off"
            placeholder="If you have any questions or comments right now, you can leave them here and we will get back to you. You can also email team@mintplexlabs.com"
            className="min-h-[60px] w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
          />
        </div>

        <div className="flex w-full items-center justify-center">
          <button
            type="submit"
            className="h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
          >
            Submit Response
          </button>
        </div>

        <div className="mb-5 flex w-full items-center justify-center">
          <button
            type="button"
            onClick={skipSurvey}
            className="mt-8 text-base font-medium text-white text-opacity-30 hover:text-opacity-100"
          >
            Skip Survey
          </button>
        </div>
      </form>
    </div>
  );
}
