<?php
// src/php-bridge/cloudpress-bridge.php
/**
 * [PHP Side] Safe String Buffer Manager
 * JS에서 메모리를 건드리는 대신, PHP 엔진이 관리하는 버퍼를 통해 데이터를 교환합니다.
 * 이 클래스는 PHP의 FFI를 사용하여 문자열의 포인터를 안전하게 얻는 유틸리티를 제공합니다.
 */
class CloudPress_Bridge {
    private static $buffers = [];
    private static $ffi = null;

    // FFI 초기화 (한 번만)
    private static function init_ffi() {
        if (self::$ffi === null) {
            // PHP 8.x 기준의 zend_string 구조체 정의 (64비트 시스템 가정)
            self::$ffi = FFI::cdef("
                typedef unsigned long zend_ulong;
                typedef size_t size_t;
                typedef unsigned int uint32_t;

                typedef struct _zend_refcounted_h {
                    uint32_t         refcount;
                    uint32_t         type_info;
                } zend_refcounted_h;

                typedef struct _zend_string {
                    zend_refcounted_h gc;
                    zend_ulong        h;
                    size_t            len;
                    char              val[1];
                } zend_string;

                typedef union _zend_value {
                    long                  lval;
                    double                dval;
                    zend_string          *str;
                    void                 *ptr;
                } zend_value;

                typedef struct _zval_struct {
                    zend_value        value;
                    uint32_t          u1_type_info;
                    uint32_t          u2_type_info;
                } zval;
            ");
        }
    }

    /**
     * JS가 안전하게 쓸 수 있는 가변 크기 메모리 공간을 PHP 힙에 확보합니다.
     *
     * @param string $id 버퍼를 식별할 고유 ID
     * @param int $size 확보할 최대 버퍼 크기 (바이트)
     * @return array{val_ptr: int, max_len: int} 버퍼의 시작 주소와 최대 길이
     */
    public static function create_buffer(string $id, int $size): array {
        self::init_ffi();
        // PHP의 str_repeat을 사용하여 PHP 힙에 문자열을 할당
        self::$buffers[$id] = str_repeat("\0", $size);
        
        // FFI를 통해 해당 문자열의 실제 데이터 포인터와 할당된 최대 길이를 반환
        $zval_ptr = FFI::addr(self::$buffers[$id]);
        $zval = FFI::cast(self::$ffi->typedef("zval*"), $zval_ptr);
        $zend_string_ptr = $zval->value.str;
        $zs = FFI::cast(self::$ffi->typedef("zend_string*"), $zend_string_ptr);

        // zend_string의 실제 할당된 용량은 len + 1 (null-terminator) + 패딩
        // 여기서는 간단히 요청된 size를 max_len으로 반환
        return [
            'val_ptr' => FFI::cast(FFI::type('long'), FFI::addr($zs->val)),
            'max_len' => $size // JS가 이 크기를 넘지 않도록 주의해야 함
        ];
    }

    /**
     * JS에서 버퍼 수정을 완료한 후, PHP 엔진에 변경 사항을 알리고 문자열을 반환합니다.
     * 이 과정에서 PHP 엔진이 문자열 길이, 해시 값 등을 자동으로 재계산합니다.
     *
     * @param string $id 버퍼 ID
     * @param int $actual_len JS가 실제로 쓴 데이터의 길이 (null-terminator 제외)
     * @return string PHP 엔진에 의해 안전하게 처리된 문자열
     * @throws Exception 버퍼 ID가 유효하지 않을 경우
     */
    public static function commit_buffer(string $id, int $actual_len): string {
        self::init_ffi();
        if (!isset(self::$buffers[$id])) {
            throw new Exception("Buffer ID '{$id}' not found.");
        }

        // PHP의 substr을 사용하여 실제 길이만큼만 잘라내어 새 문자열을 생성
        // 이 과정에서 PHP 엔진이 새 zend_string 구조체를 생성하고
        // 길이, 해시 값 등을 자동으로 올바르게 설정합니다.
        $data = substr(self::$buffers[$id], 0, $actual_len);
        unset(self::$buffers[$id]); // 사용된 버퍼는 해제
        return $data; 
    }

    /**
     * PHP 문자열의 zend_string 내부 정보를 추출하여 반환합니다.
     * (이전 답변의 get_zend_string_len_info와 유사, 안전한 브릿지 패턴에서는 직접 수정하지 않음)
     */
    public static function get_zend_string_info(string $php_string): array {
        self::init_ffi();
        $zval_ptr = FFI::addr($php_string);
        $zval = FFI::cast(self::$ffi->typedef("zval*"), $zval_ptr);
        if (FFI::is_null($zval->value.str)) {
            throw new Exception("Provided variable is not a string or is null.");
        }
        $zend_string_ptr = $zval->value.str;
        $zs = FFI::cast(self::$ffi->typedef("zend_string*"), $zend_string_ptr);

        return [
            'zend_string_ptr' => FFI::cast(FFI::type('long'), $zend_string_ptr),
            'len_ptr'         => FFI::cast(FFI::type('long'), FFI::addr($zs->len)),
            'current_len'     => $zs->len,
            'val_ptr'         => FFI::cast(FFI::type('long'), FFI::addr($zs->val))
        ];
    }
}
