import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'dangol.installBannerDismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** 홈 화면에 설치하지 않은 상태로 열었을 때 설치 방법을 안내 */
export default function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* 무시 */
    }
    if (ios) {
      setVisible(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [ios]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* 무시 */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
      <div className="flex items-start gap-3">
        <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-teal-900">홈 화면에 앱으로 설치하세요</p>
          {ios ? (
            <p className="mt-1 text-sm leading-relaxed text-teal-800">
              사파리 아래쪽 <Share size={15} className="inline -mt-0.5" /> <b>공유</b> 버튼 →{' '}
              <SquarePlus size={15} className="inline -mt-0.5" /> <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요.
              <br />
              <span className="text-xs text-teal-700">
                ※ 설치 후에는 홈 화면 아이콘으로만 사용하세요. 사파리와 데이터가 따로 저장됩니다.
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-teal-800">설치하면 인터넷 없이도 열리고, 앱처럼 바로 실행돼요.</p>
          )}
        </div>
        <button type="button" onClick={dismiss} className="-m-1 rounded-full p-1.5 text-teal-700 active:bg-teal-100" aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      {!ios && deferred && (
        <button
          type="button"
          onClick={install}
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-teal-700 font-semibold text-white active:bg-teal-800"
        >
          <Download size={18} /> 지금 설치하기
        </button>
      )}
    </div>
  );
}
