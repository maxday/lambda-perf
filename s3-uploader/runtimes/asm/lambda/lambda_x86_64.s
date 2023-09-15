.data
hello:
    .string "Hello from Assembler!"

.text
.global _start

_start:
    # write our string to stdout
    mov $1, %rax       # syscall: write
    mov $1, %rdi       # file descriptor: stdout
    mov $hello, %rsi   # pointer to message
    mov $21, %rdx      # message length
    syscall

    # exit
    mov $60, %rax      # syscall: exit
    xor %rdi, %rdi     # status: 0
    syscall
