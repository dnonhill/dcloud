@echo off
call tsc
for /R "%cd%" %%f in (*.js) do (
    del %%~nf
    ren %%f %%~nf
)
echo Build successful